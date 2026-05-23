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

# 合并所有已知属性
$globalVars = @($dataProps + $computedProps + $methodProps + @(
    'FLOW_STEPS', 'Math', 'JSON', 'console', 'Date', 'Array', 'Object', 'String', 'Number',
    'window', 'document', 'true', 'false', 'null', 'undefined',
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

function Get-ScopedVars($line) {
    $scoped = @()
    
    # v-for="item in xxx"
    $forMatches = [regex]::Matches($line, 'v-for=["'']?(?:\()?([\w,\s]+)(?:\))?\s+in\s+')
    foreach ($m in $forMatches) {
        $vars = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
        $scoped += $vars
    }
    
    # v-for="(item, index) in xxx"
    $forMatches2 = [regex]::Matches($line, 'v-for=["'']?\(([\w,\s]+)\)\s+in\s+')
    foreach ($m in $forMatches2) {
        $vars = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
        $scoped += $vars
    }
    
    # slot-scope="scope"
    $slotMatches = [regex]::Matches($line, 'slot-scope=["'']?([\w]+)')
    foreach ($m in $slotMatches) {
        $scoped += $m.Groups[1].Value
    }
    
    # slot-scope="{ row }"
    $slotMatches2 = [regex]::Matches($line, 'slot-scope=["'']?\{([\w,\s]+)\}')
    foreach ($m in $slotMatches2) {
        $vars = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
        $scoped += $vars
    }
    
    return $scoped | Select-Object -Unique
}

function Test-VarDefined($varName, $scopedVars) {
    if ($varName -in $globalVars) { return $true }
    if ($varName -in $scopedVars) { return $true }
    if ($varName -match '^\d+$') { return $true }
    if ($varName -in @('true', 'false', 'null', 'undefined')) { return $true }
    return $false
}

# 检查每一行
$issues = @()
$scopeStack = @()  # 跟踪嵌套的scope变量

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1
    
    # 跳过Vue script部分 (约3000行以后)
    if ($lineNum -gt 3005) { continue }
    
    # 更新scope stack - 简单追踪div/el-table-column等标签的开闭
    # 检测新scope的开始
    $newScoped = Get-ScopedVars $line
    if ($newScoped.Count -gt 0) {
        $scopeStack += ,$newScoped
    }
    
    # 检测标签关闭，弹出scope (简化处理：遇到</div>或</el-table-column>时弹出最近的scope)
    if ($line -match '</(?:div|el-table-column|template|el-tab-pane|el-form-item|el-dialog|el-row|el-col)[^>]*>' -and $scopeStack.Count -gt 0) {
        # 弹出最后一个scope
        $scopeStack = $scopeStack[0..($scopeStack.Count-2)]
    }
    
    # 收集当前可用的scoped变量
    $currentScoped = @()
    foreach ($scope in $scopeStack) {
        $currentScoped += $scope
    }
    $currentScoped = $currentScoped | Select-Object -Unique
    
    # 同时检查当前行的直接scope
    $lineScoped = Get-ScopedVars $line
    $allScoped = ($currentScoped + $lineScoped) | Select-Object -Unique
    
    # 1. v-model="xxx.yyy" - 只检查根变量
    $vModels = [regex]::Matches($line, 'v-model=["'']?(\w+)')
    foreach ($m in $vModels) {
        $root = $m.Groups[1].Value
        if (-not (Test-VarDefined $root $allScoped)) {
            $issues += "Line $lineNum : v-model uses undefined '$root' -> $line".Trim()
        }
    }
    
    # 2. :data="xxx" 
    $dataBindings = [regex]::Matches($line, ':data=["'']?(\w+)')
    foreach ($m in $dataBindings) {
        $root = $m.Groups[1].Value
        if (-not (Test-VarDefined $root $allScoped)) {
            $issues += "Line $lineNum : :data uses undefined '$root' -> $line".Trim()
        }
    }
    
    # 3. v-for="item in xxx" - 检查xxx是否存在
    $vFors = [regex]::Matches($line, 'v-for=["'']?(?:\()?([\w,\s]+)(?:\))?\s+in\s+(\w+)')
    foreach ($m in $vFors) {
        $root = $m.Groups[2].Value
        if (-not (Test-VarDefined $root $allScoped)) {
            $issues += "Line $lineNum : v-for uses undefined source '$root' -> $line".Trim()
        }
    }
    
    # 4. @click="xxx()" 和 @click="xxx" - 方法调用
    $clickMatches = [regex]::Matches($line, '@click=["'']?(\w+)')
    foreach ($m in $clickMatches) {
        $root = $m.Groups[1].Value
        if (-not (Test-VarDefined $root $allScoped)) {
            $issues += "Line $lineNum : @click uses undefined '$root' -> $line".Trim()
        }
    }
    
    # 5. @change, @select, @submit等事件
    $eventMatches = [regex]::Matches($line, '@[\w-]+=["'']?(\w+)')
    foreach ($m in $eventMatches) {
        $root = $m.Groups[1].Value
        if (-not (Test-VarDefined $root $allScoped)) {
            $issues += "Line $lineNum : event handler uses undefined '$root' -> $line".Trim()
        }
    }
    
    # 6. 插值 {{ xxx }} 和 {{ xxx.yyy }} - 只检查根
    $interps = [regex]::Matches($line, '\{\{\s*(\w+)')
    foreach ($m in $interps) {
        $root = $m.Groups[1].Value
        if (-not (Test-VarDefined $root $allScoped)) {
            $issues += "Line $lineNum : {{ }} uses undefined '$root' -> $line".Trim()
        }
    }
    
    # 7. :xxx="yyy" 绑定 - 只检查根变量
    $bindMatches = [regex]::Matches($line, ':[\w-]+=["'']?(\w+)')
    foreach ($m in $bindMatches) {
        $root = $m.Groups[1].Value
        if (-not (Test-VarDefined $root $allScoped)) {
            $issues += "Line $lineNum : :attr uses undefined '$root' -> $line".Trim()
        }
    }
}

Write-Host "=== Issues Found ($($issues.Count)) ===" -ForegroundColor Red
if ($issues.Count -eq 0) {
    Write-Host "No issues found!" -ForegroundColor Green
} else {
    $issues | ForEach-Object { Write-Host $_ }
}
