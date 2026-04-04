<template>
  <div class="prop-section">
    <h4 class="prop-section-title">表格配置</h4>

    <!-- Feature 选择 -->
    <div class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">功能 (Feature)</label>
      <div class="flex gap-2">
        <input
          type="text"
          readonly
          :value="selectedFeatureName"
          class="prop-input flex-1 cursor-pointer"
          placeholder="点击选择 Feature..."
          @click="openFeatureSelector"
        />
        <button
          type="button"
          class="p-2 border border-[var(--border-light)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="选择 Feature"
          @click="openFeatureSelector"
        >
          🔍
        </button>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="border-t border-[var(--border-light)] my-3"></div>

    <!-- 基础样式 -->
    <div class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">基础样式</label>
      <div class="flex flex-wrap gap-2">
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.bordered"
            @change="updateProp('bordered', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          边框
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.striped"
            @change="updateProp('striped', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          斑马纹
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.pagination"
            @change="updateProp('pagination', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          分页
        </label>
      </div>
    </div>

    <!-- 分页设置（仅分页选中时显示） -->
    <div v-if="selectedComponent.props.pagination" class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">每页条数</label>
      <input
        :value="selectedComponent.props.pageSize"
        type="number"
        min="5"
        max="100"
        class="prop-input"
        @input="updateProp('pageSize', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <!-- 表头高度 -->
    <div class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">表头高度</label>
      <select
        :value="selectedComponent.props.headerHeight || 'default'"
        class="prop-input"
        @change="updateProp('headerHeight', ($event.target as HTMLSelectElement).value)"
      >
        <option value="small">小 (32px)</option>
        <option value="default">默认 (40px)</option>
        <option value="large">大 (48px)</option>
      </select>
    </div>

    <!-- 分隔线 -->
    <div class="border-t border-[var(--border-light)] my-3"></div>

    <!-- 操作按钮 -->
    <div class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">操作按钮</label>
      <div class="flex flex-wrap gap-2">
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showSearch"
            @change="updateProp('showSearch', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          搜索
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showAdd"
            @change="updateProp('showAdd', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          新增
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showEdit"
            @change="updateProp('showEdit', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          编辑
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showDelete"
            @change="updateProp('showDelete', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          删除
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showDetail"
            @change="updateProp('showDetail', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          详情
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showExport"
            @change="updateProp('showExport', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          导出
        </label>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="border-t border-[var(--border-light)] my-3"></div>

    <!-- 列配置 - 内联编辑 -->
    <div class="prop-item">
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs text-[var(--text-muted)]">列配置 ({{ selectedComponent.props.columns?.length || 0 }})</label>
        <button
          type="button"
          class="text-xs text-[var(--accent)] hover:underline"
          @click="toggleColumnsList"
        >
          {{ showColumnsList ? '收起' : '展开' }}
        </button>
      </div>
      
      <!-- 列列表 - 可内联展开编辑 -->
      <div v-if="showColumnsList && selectedComponent.props.columns?.length" class="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <div
          v-for="(col, index) in (selectedComponent.props.columns || [])"
          :key="index"
          class="bg-[var(--bg-hover-light)] rounded"
        >
          <!-- 列基本信息行（可点击展开） -->
          <div class="flex items-center gap-2 px-3 py-2">
            <span class="w-6 text-xs text-[var(--text-muted)]">{{ index + 1 }}.</span>
            <input
              :value="col.label"
              type="text"
              class="flex-1 px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--bg-primary)]"
              placeholder="列名"
              @input="updateColumnInline(index, 'label', ($event.target as HTMLInputElement).value)"
            />
            <span class="text-xs text-[var(--text-muted)] px-2">{{ col.fieldType }}</span>
            <label class="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                :checked="col.visible"
                @change="updateColumnInline(index, 'visible', ($event.target as HTMLInputElement).checked)"
                class="w-3 h-3"
              />
              显示
            </label>
            <button
              type="button"
              class="text-xs px-2 py-1 rounded text-[var(--accent)] hover:bg-blue-50"
              @click="openColumnEditor(index)"
            >
              编辑
            </button>
            <button
              type="button"
              class="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded"
              @click="removeColumnDirect(index)"
            >
              删除
            </button>
          </div>
          
          <!-- 内联编辑区域（展开后） -->
          <div v-if="editingColumnIndex === index" class="px-3 pb-3 border-t border-[var(--border-light)] pt-2">
            <div class="grid grid-cols-4 gap-2 text-xs">
              <div>
                <label class="block text-[var(--text-muted)] mb-1">字段名</label>
                <input
                  :value="col.key"
                  type="text"
                  class="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--bg-primary)]"
                  @input="updateColumnInline(index, 'key', ($event.target as HTMLInputElement).value)"
                />
              </div>
              <div>
                <label class="block text-[var(--text-muted)] mb-1">类型</label>
                <select
                  :value="col.fieldType"
                  class="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--bg-primary)]"
                  @change="updateColumnInline(index, 'fieldType', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="text">文本</option>
                  <option value="number">数字</option>
                  <option value="date">日期</option>
                  <option value="datetime">日期时间</option>
                  <option value="select">下拉</option>
                  <option value="image">图片</option>
                  <option value="custom">自定义函数</option>
                </select>
              </div>
              <div>
                <label class="block text-[var(--text-muted)] mb-1">宽度(colspan)</label>
                <input
                  :value="col.colspan || 1"
                  type="number"
                  min="1"
                  max="12"
                  class="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--bg-primary)]"
                  @input="updateColumnInline(index, 'colspan', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div>
                <label class="block text-[var(--text-muted)] mb-1">对齐</label>
                <select
                  :value="col.align || 'left'"
                  class="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--bg-primary)]"
                  @change="updateColumnInline(index, 'align', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                </select>
              </div>
            </div>
            
            <!-- 下拉选项（仅 select 类型显示） -->
            <div v-if="col.fieldType === 'select'" class="mt-2">
              <label class="block text-[var(--text-muted)] mb-1 text-xs">下拉来源</label>
              <select
                :value="col.selectSource || 'dict'"
                class="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--bg-primary)]"
                @change="updateColumnInline(index, 'selectSource', ($event.target as HTMLSelectElement).value)"
              >
                <option value="dict">数据字典</option>
                <option value="fixed">固定值</option>
              </select>
            </div>
            
            <!-- 数据字典选项 -->
            <div v-if="col.fieldType === 'select' && (col.selectSource || 'dict') === 'dict'" class="mt-2">
              <label class="block text-[var(--text-muted)] mb-1 text-xs">选择字典</label>
              <select
                :value="col.dataDictionary || ''"
                class="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--bg-primary)]"
                @change="updateColumnInline(index, 'dataDictionary', ($event.target as HTMLSelectElement).value)"
              >
                <option value="">请选择字典</option>
                <option v-for="dict in dictList" :key="dict.id" :value="dict.code">
                  {{ dict.name }} ({{ dict.code }})
                </option>
              </select>
            </div>
            
            <!-- 固定值选项 -->
            <div v-if="col.fieldType === 'select' && col.selectSource === 'fixed'" class="mt-2">
              <label class="block text-[var(--text-muted)] mb-1 text-xs">固定选项 (JSON)</label>
              <textarea
                :value="col.fixedValues || '[]'"
                rows="3"
                placeholder='[{"label":"是","value":"1"},{"label":"否","value":"0"}]'
                class="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--bg-primary)] font-mono"
                @input="updateColumnInline(index, 'fixedValues', ($event.target as HTMLTextAreaElement).value)"
              ></textarea>
            </div>
            
            <!-- 自定义函数 -->
            <div v-if="col.fieldType === 'custom'" class="mt-2">
              <label class="block text-[var(--text-muted)] mb-1 text-xs">自定义函数 (JS)</label>
              <textarea
                :value="col.customFunction || ''"
                rows="3"
                placeholder="(value, row) => value ? '是' : '否'"
                class="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--bg-primary)] font-mono"
                @input="updateColumnInline(index, 'customFunction', ($event.target as HTMLTextAreaElement).value)"
              ></textarea>
            </div>
            
            <!-- 复选框选项 -->
            <div class="flex flex-wrap gap-4 mt-2">
              <label class="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  :checked="col.sortable"
                  @change="updateColumnInline(index, 'sortable', ($event.target as HTMLInputElement).checked)"
                  class="w-3 h-3"
                />
                排序
              </label>
              <label class="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  :checked="col.queryCondition"
                  @change="updateColumnInline(index, 'queryCondition', ($event.target as HTMLInputElement).checked)"
                  class="w-3 h-3"
                />
                查询
              </label>
              <label class="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  :checked="col.frozen"
                  @change="updateColumnInline(index, 'frozen', ($event.target as HTMLInputElement).checked)"
                  class="w-3 h-3"
                />
                冻结
              </label>
            </div>
          </div>
        </div>
        
        <!-- 添加列按钮 -->
        <button
          type="button"
          class="w-full py-2 border border-dashed border-[var(--border)] rounded text-sm text-[var(--accent)] hover:bg-[var(--bg-hover)]"
          @click="addColumnInline"
        >
          + 添加列
        </button>
      </div>
      <div v-else-if="!showColumnsList && selectedComponent.props.columns?.length" class="text-xs text-[var(--text-muted)] text-center py-2">
        已折叠，点击展开查看
      </div>
      <div v-else class="text-xs text-[var(--text-muted)] text-center py-2">
        暂无列配置
      </div>
    </div>

    <!-- 列配置侧边抽屉 (替代嵌套弹窗) -->
    <Teleport to="body">
      <div
        v-if="showColumnsDrawer"
        class="fixed inset-0 bg-black/30 z-40"
        @click.self="showColumnsDrawer = false"
      ></div>
      <div
        v-if="showColumnsDrawer"
        class="fixed right-0 top-0 h-full w-[420px] bg-[var(--bg-secondary)] shadow-2xl z-50 flex flex-col animate-slide-in"
      >
        <!-- 抽屉头部 -->
        <div class="flex items-center justify-between p-4 border-b border-[var(--border-light)] shrink-0">
          <h3 class="font-medium">{{ drawerMode === 'single' ? `编辑列 - ${drawerColumn.label}` : '批量编辑列' }}</h3>
          <button
            @click="showColumnsDrawer = false"
            class="p-1 hover:bg-[var(--bg-hover)] rounded"
          >
            ✕
          </button>
        </div>
        
        <!-- 批量编辑模式 -->
        <div v-if="drawerMode === 'batch'" class="flex-1 overflow-y-auto p-4">
          <div class="space-y-3">
            <div
              v-for="(col, index) in editingColumn"
              :key="index"
              class="bg-[var(--bg-hover-light)] rounded p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm">列 {{ index + 1 }}</span>
                <button
                  type="button"
                  class="text-[var(--danger)] hover:underline text-xs"
                  @click="removeColumn(index)"
                >
                  删除
                </button>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label class="block text-[var(--text-muted)] mb-1">字段名</label>
                  <input
                    :value="col.key"
                    type="text"
                    class="w-full px-2 py-1 border border-[var(--border)] rounded"
                    @input="updateColumn(index, 'key', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div>
                  <label class="block text-[var(--text-muted)] mb-1">显示名</label>
                  <input
                    :value="col.label"
                    type="text"
                    class="w-full px-2 py-1 border border-[var(--border)] rounded"
                    @input="updateColumn(index, 'label', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div>
                  <label class="block text-[var(--text-muted)] mb-1">类型</label>
                  <select
                    :value="col.fieldType"
                    class="w-full px-2 py-1 border border-[var(--border)] rounded"
                    @change="updateColumn(index, 'fieldType', ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="text">文本</option>
                    <option value="number">数字</option>
                    <option value="date">日期</option>
                    <option value="datetime">日期时间</option>
                    <option value="select">下拉</option>
                    <option value="image">图片</option>
                    <option value="custom">自定义函数</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[var(--text-muted)] mb-1">宽度</label>
                  <input
                    :value="col.colspan || 1"
                    type="number"
                    min="1"
                    max="12"
                    class="w-full px-2 py-1 border border-[var(--border)] rounded"
                    @input="updateColumn(index, 'colspan', Number(($event.target as HTMLInputElement).value))"
                  />
                </div>
              </div>
              <div class="flex items-center gap-3 mt-2 text-xs flex-wrap">
                <label class="flex items-center gap-1">
                  <input type="checkbox" :checked="col.visible" @change="updateColumn(index, 'visible', ($event.target as HTMLInputElement).checked)" class="w-3 h-3" />
                  显示
                </label>
                <label class="flex items-center gap-1">
                  <input type="checkbox" :checked="col.sortable" @change="updateColumn(index, 'sortable', ($event.target as HTMLInputElement).checked)" class="w-3 h-3" />
                  排序
                </label>
                <label class="flex items-center gap-1">
                  <input type="checkbox" :checked="col.queryCondition" @change="updateColumn(index, 'queryCondition', ($event.target as HTMLInputElement).checked)" class="w-3 h-3" />
                  查询
                </label>
                <label class="flex items-center gap-1">
                  <input type="checkbox" :checked="col.frozen" @change="updateColumn(index, 'frozen', ($event.target as HTMLInputElement).checked)" class="w-3 h-3" />
                  冻结
                </label>
              </div>
            </div>
            <button
              type="button"
              class="w-full py-2 border border-dashed border-[var(--border)] rounded text-sm text-[var(--accent)] hover:bg-[var(--bg-hover)]"
              @click="addColumn"
            >
              + 添加列
            </button>
          </div>
        </div>
        
        <!-- 单列编辑模式 -->
        <div v-else-if="drawerMode === 'single'" class="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[var(--text-muted)] mb-1">字段名</label>
              <input
                v-model="drawerColumn.key"
                type="text"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
              />
            </div>
            <div>
              <label class="block text-[var(--text-muted)] mb-1">显示名</label>
              <input
                v-model="drawerColumn.label"
                type="text"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[var(--text-muted)] mb-1">类型</label>
              <select
                v-model="drawerColumn.fieldType"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
              >
                <option value="text">文本</option>
                <option value="number">数字</option>
                <option value="date">日期</option>
                <option value="datetime">日期时间</option>
                <option value="select">下拉</option>
                <option value="image">图片</option>
                <option value="custom">自定义函数</option>
              </select>
            </div>
            <div>
              <label class="block text-[var(--text-muted)] mb-1">宽度(colspan)</label>
              <input
                v-model.number="drawerColumn.colspan"
                type="number"
                min="1"
                max="12"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
              />
            </div>
          </div>
          
          <!-- 下拉选项（仅 select 类型显示） -->
          <div v-if="drawerColumn.fieldType === 'select'">
            <label class="block text-[var(--text-muted)] mb-1">下拉来源</label>
            <select
              v-model="drawerColumn.selectSource"
              class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
            >
              <option value="dict">数据字典</option>
              <option value="fixed">固定值</option>
            </select>
          </div>
          
          <!-- 数据字典选项 -->
          <div v-if="drawerColumn.fieldType === 'select' && drawerColumn.selectSource === 'dict'">
            <label class="block text-[var(--text-muted)] mb-1">选择字典</label>
            <select
              v-model="drawerColumn.dataDictionary"
              class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
            >
              <option value="">请选择字典</option>
              <option v-for="dict in dictList" :key="dict.id" :value="dict.code">
                {{ dict.name }} ({{ dict.code }})
              </option>
            </select>
          </div>
          
          <!-- 固定值选项 -->
          <div v-if="drawerColumn.fieldType === 'select' && drawerColumn.selectSource === 'fixed'">
            <label class="block text-[var(--text-muted)] mb-1">固定选项 (JSON格式)</label>
            <textarea
              v-model="drawerColumn.fixedValues"
              rows="3"
              placeholder='[{"label":"是","value":"1"},{"label":"否","value":"0"}]'
              class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)] font-mono text-xs"
            ></textarea>
            <p class="text-xs text-[var(--text-muted)] mt-1">格式: [{"label":"显示文本","value":"实际值"}]</p>
          </div>
          
          <!-- 自定义函数（仅 custom 类型显示） -->
          <div v-if="drawerColumn.fieldType === 'custom'">
            <label class="block text-[var(--text-muted)] mb-1">自定义函数 (JS)</label>
            <textarea
              v-model="drawerColumn.customFunction"
              rows="3"
              placeholder="例如: (value, row) => value ? '是' : '否'"
              class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)] font-mono text-xs"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-[var(--text-muted)] mb-1">对齐</label>
            <select
              v-model="drawerColumn.align"
              class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
            >
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
          </div>
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center gap-1">
              <input type="checkbox" v-model="drawerColumn.visible" class="w-4 h-4" />
              显示
            </label>
            <label class="flex items-center gap-1">
              <input type="checkbox" v-model="drawerColumn.sortable" class="w-4 h-4" />
              排序
            </label>
            <label class="flex items-center gap-1">
              <input type="checkbox" v-model="drawerColumn.queryCondition" class="w-4 h-4" />
              查询
            </label>
            <label class="flex items-center gap-1">
              <input type="checkbox" v-model="drawerColumn.frozen" class="w-4 h-4" />
              冻结
            </label>
          </div>
        </div>
        
        <!-- 抽屉底部 -->
        <div class="flex justify-end gap-3 p-4 border-t border-[var(--border-light)] shrink-0">
          <button
            @click="showColumnsDrawer = false"
            class="px-4 py-2 text-sm border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-hover)]"
          >
            取消
          </button>
          <button
            v-if="drawerMode === 'batch'"
            @click="handleSaveColumns"
            class="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
          >
            保存
          </button>
          <button
            v-else
            @click="handleSaveDrawerColumn"
            class="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
          >
            保存
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Feature 选择器弹窗 -->
    <Teleport to="body">
      <div
        v-if="showFeatureSelectorModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showFeatureSelectorModal = false"
      >
        <div class="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
            <h3 class="font-medium">选择 Feature</h3>
            <button
              @click="showFeatureSelectorModal = false"
              class="p-1 hover:bg-[var(--bg-hover)] rounded"
            >
              ✕
            </button>
          </div>
          <div class="p-4">
            <div class="flex gap-2 mb-3">
              <input
                type="text"
                class="flex-1 px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                placeholder="搜索 Feature..."
              />
              <button
                type="button"
                class="px-3 py-2 text-sm bg-[var(--accent)] text-white rounded hover:opacity-90"
                @click="showCreateFeatureModal = true"
              >
                + 新建
              </button>
            </div>
            <div class="space-y-1 max-h-[400px] overflow-y-auto">
              <div
                v-for="feature in allFeatures"
                :key="feature.id"
                class="p-3 border border-[var(--border-light)] rounded hover:bg-[var(--bg-hover)] cursor-pointer"
                :class="{ 'border-[var(--accent)] bg-[var(--accent)]/10': feature.id === selectedComponent.props.featureId }"
                @click="selectFeatureFromModal(feature)"
              >
                <div class="font-medium">{{ feature.name }}</div>
                <div class="text-xs text-[var(--text-muted)]">{{ feature.code }} | 表: {{ feature.tableName }}</div>
              </div>
              <div v-if="loadingAllFeatures" class="text-center py-4 text-[var(--text-muted)]">加载中...</div>
              <div v-if="!loadingAllFeatures && allFeatures.length === 0" class="text-center py-4 text-[var(--text-muted)]">暂无数据</div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 新建 Feature 弹窗 -->
    <Teleport to="body">
      <div
        v-if="showCreateFeatureModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showCreateFeatureModal = false"
      >
        <div class="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-[400px]">
          <div class="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
            <h3 class="font-medium">新建功能 (Feature)</h3>
            <button
              @click="showCreateFeatureModal = false"
              class="p-1 hover:bg-[var(--bg-hover)] rounded"
            >
              ✕
            </button>
          </div>
          <div class="p-4 space-y-3 text-sm">
            <div>
              <label class="block text-[var(--text-muted)] mb-1">名称</label>
              <input
                v-model="newFeatureForm.name"
                type="text"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                placeholder="如: 用户管理"
              />
            </div>
            <div>
              <label class="block text-[var(--text-muted)] mb-1">编码</label>
              <input
                v-model="newFeatureForm.code"
                type="text"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                placeholder="如: sys_user"
              />
            </div>
            <div>
              <label class="block text-[var(--text-muted)] mb-1">描述</label>
              <textarea
                v-model="newFeatureForm.description"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                rows="3"
                placeholder="功能描述（可选）"
              ></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 p-4 border-t border-[var(--border-light)]">
            <button
              @click="showCreateFeatureModal = false"
              class="px-4 py-2 text-sm border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-hover)]"
            >
              取消
            </button>
            <button
              @click="handleCreateFeature"
              :disabled="creatingFeature || !newFeatureForm.name || !newFeatureForm.code"
              class="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {{ creatingFeature ? '创建中...' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'
import { getFeatures, getFeatureDetail, getDataSources, getTableList, saveFeature, getDictList } from '@/lib/api'

interface Props {
  selectedComponent: CanvasComponent | null
  updateProp: (key: string, value: any) => void
}

const props = defineProps<Props>()

// 数据源列表
const dataSources = ref<any[]>([])
const tables = ref<any[]>([])
const availableFeatures = ref<any[]>([])
const selectedFeatureName = computed(() => {
  const id = props.selectedComponent?.props?.featureId
  if (!id) return ''
  const feature = availableFeatures.value.find(f => f.id === id)
  return feature ? `${feature.name} (${feature.code})` : ''
})
const loadingTables = ref(false)
const loadingFeatures = ref(false)
const currentDatasourceId = ref<number | undefined>(undefined)  // 本地维护当前选中的 datasourceId
const dictList = ref<any[]>([])  // 数据字典列表

// 列配置抽屉（替代弹窗）
const showColumnsDrawer = ref(false)
const drawerMode = ref<'batch' | 'single'>('batch')
const showColumnsList = ref(false)  // 列配置列表默认折叠
const editingColumn = ref<any[]>([])
const isUserEditingColumns = ref(false)  // 用户正在编辑列，阻止 watch 覆盖
const drawerColumnIndex = ref<number>(-1)
const drawerColumn = ref<any>({})

// 新建 Feature 弹窗
const showCreateFeatureModal = ref(false)
const showFeatureSelectorModal = ref(false)
const allFeatures = ref<any[]>([])
const loadingAllFeatures = ref(false)
const creatingFeature = ref(false)
const newFeatureForm = ref({
  name: '',
  code: '',
  description: '',
})

// 打开 Feature 选择弹窗
async function openFeatureSelector() {
  showFeatureSelectorModal.value = true
  loadingAllFeatures.value = true
  try {
    const res = await getFeatures({ page: 1, limit: 100 })
    allFeatures.value = res.list || []
  } catch (error) {
    console.error('Failed to load features:', error)
    allFeatures.value = []
  } finally {
    loadingAllFeatures.value = false
  }
}

// 从弹窗选择 Feature
async function selectFeatureFromModal(feature: any) {
  props.updateProp('featureId', feature.id)
  try {
    const detail = await getFeatureDetail(feature.id)
    if (detail) {
      props.updateProp('queryApiId', detail.queryApiId)
      props.updateProp('createApiId', detail.createApiId)
      props.updateProp('updateApiId', detail.updateApiId)
      props.updateProp('deleteApiId', detail.deleteApiId)
      props.updateProp('detailApiId', detail.detailApiId)
      if (detail.columns && detail.columns.length > 0) {
        const columns = detail.columns.map((col: any) => ({
          key: col.fieldName || col.key || '',
          label: col.fieldLabel || col.label || col.fieldName || col.key || '',
          fieldType: col.fieldType || 'text',
          colspan: col.span || col.colspan || 1,
          visible: col.visible !== false,
          sortable: col.sortable || false,
          align: col.align || 'left',
          frozen: col.frozen || false,
          ellipsis: col.ellipsis !== false,
          tooltip: col.tooltip || false,
          required: col.required || false,
          placeholder: col.placeholder || '',
          queryCondition: col.queryCondition || false,
          dataDictionary: col.dataDictionary || '',
          headerOverflow: col.headerOverflow || 'wrap',
          overflow: col.overflow || 'ellipsis'
        }))
        props.updateProp('columns', columns)
      }
    }
  } catch (error) {
    console.error('Failed to load feature detail:', error)
  }
  showFeatureSelectorModal.value = false
}

// 加载数据源列表
async function loadDataSources() {
  try {
    const res = await getDataSources({ page: 1, limit: 100 })
    dataSources.value = res.list || []
  } catch (error) {
    console.error('Failed to load dataSources:', error)
    dataSources.value = []
  }
}

// 加载数据字典列表
async function loadDicts() {
  try {
    const res = await getDictList({ page: 1, limit: 100 })
    dictList.value = res.list || []
  } catch (error) {
    console.error('Failed to load dicts:', error)
    dictList.value = []
  }
}

// 加载表名列表
async function loadTables() {
  const datasourceId = props.selectedComponent?.props.datasourceId
  if (!datasourceId) {
    tables.value = []
    return
  }

  let ds = dataSources.value.find(d => d.id === datasourceId)
  if (!ds) {
    await loadDataSources()
    ds = dataSources.value.find(d => d.id === datasourceId)
  }

  if (!ds) {
    tables.value = []
    return
  }

  const dbName = ds.database_name || ds.dbName || ds.databaseName
  if (!dbName) {
    tables.value = []
    return
  }

  loadingTables.value = true
  try {
    const res = await getTableList(dbName)
    tables.value = res || []
  } catch (error) {
    console.error('Failed to load tables:', error)
    tables.value = []
  } finally {
    loadingTables.value = false
  }
}

// 加载 Feature 列表
async function loadFeaturesForTable() {
  const tableName = props.selectedComponent?.props.tableName
  const datasourceId = props.selectedComponent?.props.datasourceId
  if (!tableName || !datasourceId) {
    availableFeatures.value = []
    return
  }

  loadingFeatures.value = true
  try {
    // 后端若不支持过滤则先获取全部，再前端过滤
    const res = await getFeatures({ page: 1, limit: 100 })
    const allList = res.list || []
    
    // 前端过滤：匹配 datasourceId 和 tableName
    const filtered = allList.filter((f: any) => {
      const fDsId = Number(f.datasourceId)
      const fTableName = String(f.tableName || '')
      return fDsId === Number(datasourceId) && fTableName === String(tableName)
    })
    
    availableFeatures.value = filtered
  } catch (error) {
    console.error('Failed to load features:', error)
    availableFeatures.value = []
  } finally {
    loadingFeatures.value = false
  }
}

// 处理数据源变化
function handleDatasourceChange(value: string) {
  const newDsId = value ? parseInt(value) : undefined
  if (!newDsId) {
    props.updateProp('datasourceId', undefined)
    props.updateProp('tableName', undefined)
    props.updateProp('featureId', undefined)
    tables.value = []
    availableFeatures.value = []
    currentDatasourceId.value = undefined
    return
  }
  
  // 先更新本地 state
  currentDatasourceId.value = newDsId
  
  // 再 emit 通知父组件更新
  props.updateProp('datasourceId', newDsId)
  props.updateProp('tableName', undefined)
  props.updateProp('featureId', undefined)
  
  // 再加载表名（本地 state 直接使用 newDsId）
  doLoadTables(newDsId)
}

// 根据 datasourceId 加载表名（直接使用传入的参数，不从 props 读取）
async function doLoadTables(datasourceId: number) {
  // 先确保数据源列表已加载
  if (dataSources.value.length === 0) {
    await loadDataSources()
  }
  
  let ds = dataSources.value.find(d => d.id === datasourceId)
  if (!ds) return
  
  const dbName = ds.database_name || ds.dbName || ds.databaseName
  if (!dbName) return
  
  loadingTables.value = true
  try {
    const res = await getTableList(dbName)
    tables.value = res || []
  } catch (error) {
    console.error('Failed to load tables:', error)
    tables.value = []
  } finally {
    loadingTables.value = false
  }
}

// 处理表名变化
function handleTableChange(value: string) {
  if (!value) {
    props.updateProp('tableName', undefined)
    props.updateProp('featureId', undefined)
    availableFeatures.value = []
    return
  }
  
  // 先 emit 通知父组件
  props.updateProp('tableName', value)
  props.updateProp('featureId', undefined)
  
  // 再加载 features（使用本地维护的 currentDatasourceId）
  doLoadFeatures(currentDatasourceId.value, value)
}

// 根据 datasourceId 和 tableName 加载 features
async function doLoadFeatures(datasourceId: any, tableName: string) {
  if (!datasourceId || !tableName) return
  
  loadingFeatures.value = true
  try {
    const res = await getFeatures({ page: 1, limit: 100 })
    const allList = res.list || []
    const filtered = allList.filter((f: any) => {
      return Number(f.datasourceId) === Number(datasourceId) && String(f.tableName) === String(tableName)
    })
    availableFeatures.value = filtered
  } catch (error) {
    console.error('Failed to load features:', error)
    availableFeatures.value = []
  } finally {
    loadingFeatures.value = false
  }
}

// 处理 Feature 变化
async function handleFeatureChange(featureId: string) {
  if (!featureId) {
    props.updateProp('featureId', undefined)
    props.updateProp('queryApiId', undefined)
    props.updateProp('createApiId', undefined)
    props.updateProp('updateApiId', undefined)
    props.updateProp('deleteApiId', undefined)
    props.updateProp('detailApiId', undefined)
    props.updateProp('columns', [])
    return
  }

  // 设置 featureId（parseInt 确保是数字类型）
  props.updateProp('featureId', parseInt(featureId))

  try {
    const detail = await getFeatureDetail(parseInt(featureId))
    if (detail) {
      props.updateProp('queryApiId', detail.queryApiId)
      props.updateProp('createApiId', detail.createApiId)
      props.updateProp('updateApiId', detail.updateApiId)
      props.updateProp('deleteApiId', detail.deleteApiId)
      props.updateProp('detailApiId', detail.detailApiId)
      // 不再从 API 加载列配置，因为组件已经存储了正确的列信息
      // API 返回的列格式是 fieldName/fieldLabel，和组件的 key/label 格式不匹配
    }
  } catch (error) {
    console.error('Failed to load feature detail:', error)
  }
}

// 新建 Feature
async function handleCreateFeature() {
  if (!newFeatureForm.value.name || !newFeatureForm.value.code) return

  creatingFeature.value = true
  try {
    const datasourceId = props.selectedComponent?.props.datasourceId
    const tableName = props.selectedComponent?.props.tableName
    await saveFeature({
      name: newFeatureForm.value.name,
      code: newFeatureForm.value.code,
      description: newFeatureForm.value.description,
      datasourceId: datasourceId,
      tableName: tableName,
    })
    showCreateFeatureModal.value = false
    newFeatureForm.value = { name: '', code: '', description: '' }
    await loadFeaturesForTable()
  } catch (error) {
    console.error('Failed to create feature:', error)
    alert('创建失败')
  } finally {
    creatingFeature.value = false
  }
}

// 打开列配置抽屉（批量编辑）
function openColumnsEditor() {
  isUserEditingColumns.value = true
  drawerMode.value = 'batch'
  const cols = props.selectedComponent?.props?.columns || []
  editingColumn.value = JSON.parse(JSON.stringify(cols))
  showColumnsDrawer.value = true
}

// 打开单列编辑器抽屉
function openColumnEditor(index: number) {
  drawerMode.value = 'single'
  drawerColumnIndex.value = index
  drawerColumn.value = { ...props.selectedComponent?.props.columns?.[index] }
  // 如果还没加载字典，先加载
  if (dictList.value.length === 0) {
    loadDicts()
  }
  showColumnsDrawer.value = true
}

// 保存抽屉中的单列编辑
function handleSaveDrawerColumn() {
  const columns = [...(props.selectedComponent?.props.columns || [])]
  columns[drawerColumnIndex.value] = { ...drawerColumn.value }
  props.updateProp('columns', columns)
  showColumnsDrawer.value = false
}

// 更新编辑中的列
function updateColumn(index: number, field: string, value: any) {
  editingColumn.value[index][field] = value
}

// 添加列
function addColumn() {
  editingColumn.value.push({
    key: '',
    label: '',
    fieldType: 'text',
    colspan: 1,
    visible: true,
    sortable: false,
    align: 'left',
    frozen: false,
    ellipsis: true,
    tooltip: false,
    required: false,
    placeholder: '',
    queryCondition: false,
    dataDictionary: ''
  })
}

// 删除列（从编辑弹窗）
function removeColumn(index: number) {
  editingColumn.value.splice(index, 1)
}

// 直接删除列（不经过编辑弹窗）
function removeColumnDirect(index: number) {
  const columns = [...(props.selectedComponent?.props?.columns || [])]
  columns.splice(index, 1)
  props.updateProp('columns', columns)
}

// 保存所有列
function handleSaveColumns() {
  const columnsCopy = JSON.parse(JSON.stringify(editingColumn.value))
  props.updateProp('columns', columnsCopy)
  showColumnsDrawer.value = false
  isUserEditingColumns.value = false
}

// 内联编辑：切换列列表展开/折叠
function toggleColumnsList() {
  showColumnsList.value = !showColumnsList.value
  // 折叠时重置编辑状态
  if (!showColumnsList.value) {
    editingColumnIndex.value = -1
  }
}

// 内联编辑：切换单列展开/折叠
function toggleColumnEditor(index: number) {
  if (editingColumnIndex.value === index) {
    editingColumnIndex.value = -1
  } else {
    editingColumnIndex.value = index
    // 确保字典列表已加载
    if (dictList.value.length === 0) {
      loadDicts()
    }
  }
}

// 内联编辑：实时更新列属性
function updateColumnInline(index: number, field: string, value: any) {
  const columns = [...(props.selectedComponent?.props?.columns || [])]
  columns[index] = { ...columns[index], [field]: value }
  props.updateProp('columns', columns)
}

// 内联编辑：添加列
function addColumnInline() {
  const columns = [...(props.selectedComponent?.props?.columns || [])]
  columns.push({
    key: '',
    label: '',
    fieldType: 'text',
    colspan: 1,
    visible: true,
    sortable: false,
    align: 'left',
    frozen: false,
    ellipsis: true,
    tooltip: false,
    required: false,
    placeholder: '',
    queryCondition: false,
    dataDictionary: ''
  })
  props.updateProp('columns', columns)
  // 自动展开新添加的列
  editingColumnIndex.value = columns.length - 1
}

// 初始化监听
watch(() => props.selectedComponent?.id, () => {
  isUserEditingColumns.value = false
  if (props.selectedComponent?.type === 'table') {
    loadDataSources()
  }
}, { immediate: true })

watch(() => props.selectedComponent?.props?.datasourceId, (newDsId) => {
  if (props.selectedComponent?.type === 'table' && newDsId) {
    loadTables()
  } else {
    tables.value = []
  }
})

watch(() => props.selectedComponent?.props?.tableName, (newTableName) => {
  if (props.selectedComponent?.type === 'table' && newTableName && props.selectedComponent?.props?.datasourceId) {
    loadFeaturesForTable()
  } else {
    availableFeatures.value = []
  }
})

// 当 datasourceId 或 tableName 变化时，加载 features 列表
// 不再触发 handleFeatureChange，避免覆盖用户已修改的列
watch([() => props.selectedComponent?.props?.datasourceId, () => props.selectedComponent?.props?.tableName], async ([dsId, tableName]) => {
  if (props.selectedComponent?.type === 'table' && dsId && tableName) {
    await loadFeaturesForTable()
  }
})

// 监听 columns 变化
watch(() => props.selectedComponent?.props?.columns, (newCols) => {
  console.log('[TableProps] columns changed:', newCols?.length)
}, { immediate: true })
</script>
