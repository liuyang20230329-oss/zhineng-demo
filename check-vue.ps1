# 读取HTML文件
$content = Get-Content -Path "D:\系统测试\SpaceX-交互Demo-最新.html" -Raw

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

# 合并所有已知属性
$allKnown = @($dataProps + $computedProps + $methodProps + @('FLOW_STEPS', 'allStatusList', 'taskCount', 'approvalCount', 'pendingCount', 'completedCount', 'archivedCount', 'totalPending', 'isDataCollectPage', 'filteredProjects', 'examinePendingCount', 'examineProcessingCount', 'examineApprovedCount', 'customerSearch', 'contractSearch', 'dispatchSearch', 'financeSearch', 'msSearch', 'knowledgeSearch', 'settingSearch', 'reportSearch', 'dataCollectSearch', 'dataInitSearch', 'dataVerifySearch', 'accountInfoSearch', 'riskAssessSearch', 'settingCurrentMenu', 'settingBizTypeSearch', 'settingContractSearch', 'settingClientSearch', 'settingUserSearch', 'settingRoleSearch', 'settingOrgSearch', 'settingProcessSearch', 'settingTemplateSearch', 'settingPermissionSearch')) | Select-Object -Unique

Write-Host "=== Data properties ($($dataProps.Count)) ===" -ForegroundColor Cyan
$dataProps | Sort-Object | ForEach-Object { Write-Host "  $_" }

Write-Host "`n=== Computed properties ($($computedProps.Count)) ===" -ForegroundColor Cyan
$computedProps | Sort-Object | ForEach-Object { Write-Host "  $_" }

Write-Host "`n=== Methods ($($methodProps.Count)) ===" -ForegroundColor Cyan
$methodProps | Sort-Object | ForEach-Object { Write-Host "  $_" }

# 分割成行用于查找行号
$lines = $content -split "`n"

# 查找模板引用
$issues = @()

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1
    
    # 跳过script部分（Vue定义部分）
    if ($lineNum -gt 3000 -and $lineNum -lt 5450) { continue }
    
    # 1. 检查 v-model="xxx.yyy" - 检查xxx是否在data中
    $vModels = [regex]::Matches($line, 'v-model=["'']?(\w+)\.')
    foreach ($m in $vModels) {
        $root = $m.Groups[1].Value
        if ($root -notin $allKnown -and $root -ne 'form') {
            # form is special
            $issues += "Line $lineNum : v-model uses undefined root '$root'"
        }
    }
    
    # 2. 检查 :data="xxx" 
    $dataBindings = [regex]::Matches($line, ':data=["'']?(\w+)')
    foreach ($m in $dataBindings) {
        $root = $m.Groups[1].Value
        if ($root -notin $allKnown) {
            $issues += "Line $lineNum : :data uses undefined '$root'"
        }
    }
    
    # 3. 检查 v-for="item in xxx"
    $vFors = [regex]::Matches($line, 'v-for=["'']?\w+\s+in\s+(\w+)')
    foreach ($m in $vFors) {
        $root = $m.Groups[1].Value
        if ($root -notin $allKnown) {
            $issues += "Line $lineNum : v-for uses undefined '$root'"
        }
    }
    
    # 4. 检查 @click="xxx()" 和 @click="xxx"
    $clicks = [regex]::Matches($line, '@click=["'']?(\w+)')
    foreach ($m in $clicks) {
        $root = $m.Groups[1].Value
        if ($root -notin $allKnown) {
            $issues += "Line $lineNum : @click uses undefined method '$root'"
        }
    }
    
    # 5. 检查 {{ xxx }} 插值表达式
    $interps = [regex]::Matches($line, '\{\{\s*(\w+)')
    foreach ($m in $interps) {
        $root = $m.Groups[1].Value
        if ($root -notin $allKnown) {
            $issues += "Line $lineNum : interpolation uses undefined '$root'"
        }
    }
    
    # 6. 检查 :class="xxx" 和 :xxx="yyy"
    $binds = [regex]::Matches($line, ':[\w-]+=["'']?(\w+)')
    foreach ($m in $binds) {
        $root = $m.Groups[1].Value
        # 排除布尔值和数字
        if ($root -notin @('true', 'false') -and $root -notmatch '^\d+$' -and $root -notin $allKnown) {
            $issues += "Line $lineNum : binding uses undefined '$root'"
        }
    }
}

Write-Host "`n=== Issues Found ===" -ForegroundColor Red
if ($issues.Count -eq 0) {
    Write-Host "No issues found!" -ForegroundColor Green
} else {
    $issues | ForEach-Object { Write-Host $_ }
}
