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
    '$message', '$confirm', '$refs', '$nextTick', '$set', '$delete',
    'allStatusList', 'taskCount', 'approvalCount', 'pendingCount', 'completedCount', 'archivedCount', 
    'totalPending', 'isDataCollectPage', 'filteredProjects', 'filteredExamineList',
    'examinePendingCount', 'examineProcessingCount', 'examineApprovedCount', 'examineRejectedCount',
    'filteredCustomers', 'filteredContracts', 'filteredAccountSets',
    'filteredBizTypes', 'filteredCpaInfos', 'filteredRoles', 'filteredUsers',
    'filteredCollectTasks', 'filteredInitTasks', 'filteredVerifyTasks',
    'filteredManuscripts', 'filteredFlows', 'filteredLogs', 'filteredArchiveConfigs',
    'filteredNotificationConfigs', 'filteredParams', 'filteredProjectOps',
    'filteredRisks', 'filteredStandardSubjects', 'filteredSubjectMappings',
    'newCustomerThisMonth', 'activeCustomerCount', 'potentialCustomerCount',
    'activeContractCount', 'pendingContractCount', 'expireThisMonthCount',
    'newProjectThisMonth', 'processingProjectCount', 'completedProjectCount',
    'collectProcessingCount', 'collectCompletedCount', 'collectFailedCount',
    'initProcessingCount', 'initCompletedCount', 'initFailedCount',
    'verifyPassedCount', 'verifyWarningCount', 'verifyErrorCount',
    'accountSetEnabledCount', 'accountSetDisabledCount', 'accountSetNewThisMonth',
    'detailInfoRows', 'manuscriptSections', 'generateReportNoPreview',
    'getStatusButtons', 'getStatusClass', 'getStepCircleStyle', 'getStepLabelStyle',
    'getFlowStepClass', 'getFlowArrowClass', 'getConnectorStyle',
    'getExamineStatusClass', 'getBizTypeRowClass', 'getTaskStatusStyle',
    'getMenuTitle', 'getSettingMenuTitle',
    'examineTabs'
)) | Select-Object -Unique

# 收集所有scoped变量定义（v-for迭代器, slot-scope变量）
$allScopedVars = @()

# v-for="item in xxx"
$forMatches = [regex]::Matches($content, 'v-for=["'']?(?:\()?([\w,\s]+)(?:\))?\s+in\s+')
foreach ($m in $forMatches) {
    $vars = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
    $allScopedVars += $vars
}

# slot-scope="scope"
$slotMatches = [regex]::Matches($content, 'slot-scope=["'']?([\w]+)')
foreach ($m in $slotMatches) {
    $allScopedVars += $m.Groups[1].Value
}

# slot-scope="{ row }"
$slotMatches2 = [regex]::Matches($content, 'slot-scope=["'']?\{([\w,\s]+)\}')
foreach ($m in $slotMatches2) {
    $vars = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
    $allScopedVars += $vars
}

$allScopedVars = $allScopedVars | Select-Object -Unique
Write-Host "=== Scoped vars found: $($allScopedVars -join ', ') ===" -ForegroundColor Cyan

# 检查每一行
$issues = @()

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1
    
    # 跳过Vue script部分 (约3000行以后)
    if ($lineNum -gt 3005) { continue }
    if ($lineNum -lt 250) { continue } # 跳过head/style
    
    # 获取当前行的scoped变量
    $lineScoped = @()
    $forMatches = [regex]::Matches($line, 'v-for=["'']?(?:\()?([\w,\s]+)(?:\))?\s+in\s+')
    foreach ($m in $forMatches) {
        $vars = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
        $lineScoped += $vars
    }
    $slotMatches = [regex]::Matches($line, 'slot-scope=["'']?([\w]+)')
    foreach ($m in $slotMatches) {
        $lineScoped += $m.Groups[1].Value
    }
    $slotMatches2 = [regex]::Matches($line, 'slot-scope=["'']?\{([\w,\s]+)\}')
    foreach ($m in $slotMatches2) {
        $vars = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
        $lineScoped += $vars
    }
    $lineScoped = $lineScoped | Select-Object -Unique
    
    $currentScoped = ($allScopedVars + $lineScoped) | Select-Object -Unique
    
    function Is-Defined($varName) {
        if ($varName -in $globalVars) { return $true }
        if ($varName -in $currentScoped) { return $true }
        if ($varName -match '^\d+$') { return $true }
        if ($varName -in @('true', 'false', 'null', 'undefined', 'yes', 'no')) { return $true }
        return $false
    }
    
    # 1. v-model="xxx.yyy" - 只检查根变量
    $vModels = [regex]::Matches($line, 'v-model=["'']?(\w+)')
    foreach ($m in $vModels) {
        $root = $m.Groups[1].Value
        if (-not (Is-Defined $root)) {
            $issues += [PSCustomObject]@{ Line = $lineNum; Type = 'v-model'; Var = $root; Context = $line.Trim() }
        }
    }
    
    # 2. :data="xxx" 
    $dataBindings = [regex]::Matches($line, ':data=["'']?(\w+)')
    foreach ($m in $dataBindings) {
        $root = $m.Groups[1].Value
        if (-not (Is-Defined $root)) {
            $issues += [PSCustomObject]@{ Line = $lineNum; Type = ':data'; Var = $root; Context = $line.Trim() }
        }
    }
    
    # 3. v-for="item in xxx" - 检查xxx是否存在
    $vFors = [regex]::Matches($line, 'v-for=["'']?(?:\()?([\w,\s]+)(?:\))?\s+in\s+(\w+)')
    foreach ($m in $vFors) {
        $root = $m.Groups[2].Value
        if (-not (Is-Defined $root)) {
            $issues += [PSCustomObject]@{ Line = $lineNum; Type = 'v-for source'; Var = $root; Context = $line.Trim() }
        }
    }
    
    # 4. @click="xxx()" 和 @click="xxx" - 方法调用 (支持有参数和无参数)
    $clickMatches = [regex]::Matches($line, '@click=["'']?(\w+)(?:\(|["'\s])')
    foreach ($m in $clickMatches) {
        $root = $m.Groups[1].Value
        if (-not (Is-Defined $root)) {
            $issues += [PSCustomObject]@{ Line = $lineNum; Type = '@click'; Var = $root; Context = $line.Trim() }
        }
    }
    
    # 5. @change, @select, @submit等事件 (支持有参数)
    $eventMatches = [regex]::Matches($line, '@[\w-]+=["'']?(\w+)(?:\(|["'\s])')
    foreach ($m in $eventMatches) {
        $root = $m.Groups[1].Value
        if (-not (Is-Defined $root)) {
            $issues += [PSCustomObject]@{ Line = $lineNum; Type = 'event'; Var = $root; Context = $line.Trim() }
        }
    }
    
    # 6. 插值 {{ xxx }} 和 {{ xxx.yyy }} - 只检查根
    $interps = [regex]::Matches($line, '\{\{\s*(\w+)')
    foreach ($m in $interps) {
        $root = $m.Groups[1].Value
        if (-not (Is-Defined $root)) {
            $issues += [PSCustomObject]@{ Line = $lineNum; Type = '{{ }}'; Var = $root; Context = $line.Trim() }
        }
    }
    
    # 7. :xxx="yyy" 绑定 - 只检查根变量
    $bindMatches = [regex]::Matches($line, ':[\w-]+=["'']?(\w+)')
    foreach ($m in $bindMatches) {
        $root = $m.Groups[1].Value
        if (-not (Is-Defined $root)) {
            $issues += [PSCustomObject]@{ Line = $lineNum; Type = ':attr'; Var = $root; Context = $line.Trim() }
        }
    }
}

Write-Host "`n=== Issues Found ($($issues.Count)) ===" -ForegroundColor Red
if ($issues.Count -eq 0) {
    Write-Host "No issues found!" -ForegroundColor Green
} else {
    $issues | ForEach-Object { 
        Write-Host "Line $($_.Line) : $($_.Type) uses undefined '$($_.Var)'"
        Write-Host "  -> $($_.Context.Substring(0, [Math]::Min(120, $_.Context.Length)))"
        Write-Host ""
    }
}
