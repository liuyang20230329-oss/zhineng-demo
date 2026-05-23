# 读取HTML文件
$content = Get-Content -Path "D:\系统测试\SpaceX-交互Demo-最新.html" -Raw
$lines = $content -split "`r?`n"

# 提取data中的属性名
$dataMatch = [regex]::Match($content, 'data:\s*\{([\s\S]*?)\n\s+computed:', [System.Text.RegularExpressions.RegexOptions]::Singleline)
$dataSection = $dataMatch.Groups[1].Value
$dataProps = [regex]::Matches($dataSection, '^\s+(\w+):', [System.Text.RegularExpressions.RegexOptions]::Multiline) | ForEach-Object { $_.Groups[1].Value }

# 提取computed属性名
$computedMatch = [regex]::Match($content, 'computed:\s*\{([\s\S]*?)\n\s+methods:', [System.Text.RegularExpressions.RegexOptions]::Singleline)
$computedSection = $computedMatch.Groups[1].Value
$computedProps = [regex]::Matches($computedSection, '(\w+)\s*\(\s*\)\s*\{') | ForEach-Object { $_.Groups[1].Value }

# 提取methods属性名
$methodsMatch = [regex]::Match($content, 'methods:\s*\{([\s\S]*?)\n\s+(watch:|created|mounted|beforeDestroy)', [System.Text.RegularExpressions.RegexOptions]::Singleline)
$methodsSection = $methodsMatch.Groups[1].Value
$methodProps = [regex]::Matches($methodsSection, '(\w+)\s*\([^)]*\)\s*\{') | ForEach-Object { $_.Groups[1].Value }

# 合并所有已知全局属性
$globalVars = @($dataProps + $computedProps + $methodProps + @(
    'FLOW_STEPS', 'Math', 'JSON', 'console', 'Date', 'Array', 'Object', 'String', 'Number',
    'window', 'document', 'true', 'false', 'null', 'undefined',
    '$message', '$confirm', '$refs', '$nextTick', '$set', '$delete'
)) | Select-Object -Unique

# 收集所有scoped变量定义
$allScopedVars = @()
$forMatches = [regex]::Matches($content, 'v-for=["'']?(?:\()?([\w,\s]+)(?:\))?\s+in\s+')
foreach ($m in $forMatches) {
    $vars = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
    $allScopedVars += $vars
}
$slotMatches = [regex]::Matches($content, 'slot-scope=["'']?([\w]+)')
foreach ($m in $slotMatches) {
    $allScopedVars += $m.Groups[1].Value
}
$slotMatches2 = [regex]::Matches($content, 'slot-scope=["'']?\{([\w,\s]+)\}')
foreach ($m in $slotMatches2) {
    $vars = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
    $allScopedVars += $vars
}
$allScopedVars = $allScopedVars | Select-Object -Unique

# 收集所有模板中的引用
$vModelRefs = @()
$dataRefs = @()
$vForRefs = @()
$clickRefs = @()
$eventRefs = @()
$interpRefs = @()
$bindRefs = @()

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1
    if ($lineNum -gt 3005) { continue }
    if ($lineNum -lt 250) { continue }
    
    # v-model
    foreach ($m in [regex]::Matches($line, 'v-model=["'']?(\w+)')) {
        $vModelRefs += [PSCustomObject]@{ Line = $lineNum; Var = $m.Groups[1].Value }
    }
    
    # :data
    foreach ($m in [regex]::Matches($line, ':data=["'']?(\w+)')) {
        $dataRefs += [PSCustomObject]@{ Line = $lineNum; Var = $m.Groups[1].Value }
    }
    
    # v-for source
    foreach ($m in [regex]::Matches($line, 'v-for=["'']?(?:\()?([\w,\s]+)(?:\))?\s+in\s+(\w+)')) {
        $vForRefs += [PSCustomObject]@{ Line = $lineNum; Var = $m.Groups[2].Value }
    }
    
    # @click
    foreach ($m in [regex]::Matches($line, '@click=["'']?(\w+)')) {
        $clickRefs += [PSCustomObject]@{ Line = $lineNum; Var = $m.Groups[1].Value }
    }
    
    # events
    foreach ($m in [regex]::Matches($line, '@[\w-]+=["'']?(\w+)')) {
        $eventRefs += [PSCustomObject]@{ Line = $lineNum; Var = $m.Groups[1].Value; Type = $m.Value.Split('=')[0] }
    }
    
    # interpolation
    foreach ($m in [regex]::Matches($line, '\{\{\s*(\w+)')) {
        $interpRefs += [PSCustomObject]@{ Line = $lineNum; Var = $m.Groups[1].Value }
    }
    
    # :attr
    foreach ($m in [regex]::Matches($line, ':[\w-]+=["'']?(\w+)')) {
        $bindRefs += [PSCustomObject]@{ Line = $lineNum; Var = $m.Groups[1].Value; Attr = $m.Value.Split('=')[0] }
    }
}

Write-Host "=== Summary of References Checked ===" -ForegroundColor Cyan
Write-Host "v-model references: $($vModelRefs.Count) unique vars: $($vModelRefs.Var | Select-Object -Unique)"
Write-Host "`n:data references: $($dataRefs.Count) unique vars: $($dataRefs.Var | Select-Object -Unique)"
Write-Host "`nv-for sources: $($vForRefs.Count) unique vars: $($vForRefs.Var | Select-Object -Unique)"
Write-Host "`n@click handlers: $($clickRefs.Count) unique methods: $($clickRefs.Var | Select-Object -Unique)"
Write-Host "`nEvent handlers: $($eventRefs.Count) unique methods: $($eventRefs.Var | Select-Object -Unique)"
Write-Host "`nInterpolations: $($interpRefs.Count) unique vars: $($interpRefs.Var | Select-Object -Unique)"
Write-Host "`n:attr bindings: $($bindRefs.Count) unique vars: $($bindRefs.Var | Select-Object -Unique)"

# 检查未定义的引用
Write-Host "`n=== Checking for Undefined References ===" -ForegroundColor Yellow

$allRefs = $vModelRefs + $dataRefs + $vForRefs + $clickRefs + $eventRefs + $interpRefs + $bindRefs
$undefined = @()

foreach ($ref in $allRefs) {
    $var = $ref.Var
    if ($var -in $globalVars -or $var -in $allScopedVars -or $var -match '^\d+$' -or $var -in @('true','false','null','undefined','yes','no')) {
        continue
    }
    $undefined += $ref
}

if ($undefined.Count -eq 0) {
    Write-Host "No undefined references found!" -ForegroundColor Green
} else {
    Write-Host "Found $($undefined.Count) undefined references:" -ForegroundColor Red
    $undefined | ForEach-Object {
        Write-Host "  Line $($_.Line): $($_.Var)"
    }
}
