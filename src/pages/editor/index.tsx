import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, Layers, Settings2, Plus, X } from 'lucide-react';
import ComponentPanel from './ComponentPanel';
import ComponentTree from './ComponentTree';
import DropCanvas, { generateId } from './DropCanvas';
import PropertyPanel from './PropertyPanel';
import { CanvasComponent } from './types';
import { getPageConfig, savePageConfig } from '../../lib/api';
import { useToast } from '../../components/Toast';

function PageEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [components, setComponents] = useState<CanvasComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPropsModal, setShowPropsModal] = useState(false);
  const [pageName, setPageName] = useState('未命名页面');
  const [pageCode, setPageCode] = useState('');
  const [pageId, setPageId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [isNewPage, setIsNewPage] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'layer' | 'components' | 'props' | ''>('');

  const findComponent = (comps: CanvasComponent[], id: string | null): CanvasComponent | null => {
    if (!id) return null;
    for (const c of comps) {
      if (c.id === id) return c;
      if (c.children && c.children.length > 0) {
        const found = findComponent(c.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to find parent container ID of a component
  const findParentContainerId = (comps: CanvasComponent[], childId: string, parentId: string | null = null): string | null => {
    for (const c of comps) {
      if (c.id === childId) {
        return parentId;
      }
      if (c.children && c.children.length > 0) {
        const found = findParentContainerId(c.children, childId, c.id);
        if (found !== null) return found;
      }
    }
    return null;
  };

  const selectedComponent = findComponent(components, selectedId);

  // Helper to load a component from flat data (returns empty children, tree built separately)
  const loadComponent = (c: Record<string, unknown>): CanvasComponent => {
    let props: Record<string, unknown> = {};
    try {
      props = JSON.parse(c.props as string || '{}');
    } catch {}
    return {
      id: String(c.id) || `comp_${Date.now()}`,
      componentId: c.componentId as string || undefined,
      parentId: c.parentId as string || undefined,
      type: c.type as string,
      label: (c.label as string) || '',
      props,
      children: []
    };
  };

  // Build tree structure from flat list with parentId
  const buildComponentTree = (flatComponents: Record<string, unknown>[]): CanvasComponent[] => {
    const componentMap = new Map<string | number, CanvasComponent>();
    const rootComponents: CanvasComponent[] = [];

    // First create all components
    flatComponents.forEach(c => {
      const comp = loadComponent(c);
      componentMap.set(c.id as string | number, comp);
    });

    // Then build parent-child relationships
    flatComponents.forEach(c => {
      const comp = componentMap.get(c.id as string | number)!;
      const parentId = c.parentId as string | number | null | undefined;
      if (parentId) {
        const parent = componentMap.get(parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(comp);
        } else {
          rootComponents.push(comp);
        }
      } else {
        rootComponents.push(comp);
      }
    });

    // Fix childrenMap: resolve childrenMap IDs to actual component objects
    // This handles containers (like Tabs) that store children in childrenMap instead of parentId
    componentMap.forEach(comp => {
      const childrenMap = comp.props?.childrenMap as Record<string, string[]> | undefined;
      if (childrenMap && typeof childrenMap === 'object') {
        // Collect all child IDs from all tabs
        const allChildIds: string[] = [];
        Object.values(childrenMap).forEach(ids => {
          if (Array.isArray(ids)) {
            allChildIds.push(...ids);
          }
        });
        
        // Resolve IDs to actual components and populate children array
        const resolvedChildren = allChildIds
          .map(id => componentMap.get(id))
          .filter((c): c is CanvasComponent => c !== undefined);
        
        if (resolvedChildren.length > 0) {
          // Merge resolved children into comp.children, avoiding duplicates
          const existingIds = new Set(comp.children?.map(c => c.id) || []);
          resolvedChildren.forEach(child => {
            if (!existingIds.has(child.id)) {
              comp.children = comp.children || [];
              comp.children.push(child);
            }
          });
        }
      }
    });

    return rootComponents;
  };

  // Auto-save for new pages (creates initial record in database)
  const autoSaveNewPage = useCallback(async () => {
    if (!isNewPage || pageId) return;
    
    const timestamp = Date.now();
    const name = `未命名页面-${timestamp}`;
    const code = `page_${timestamp}`;
    
    try {
      const result = await savePageConfig({
        name,
        code,
        description: '',
        components: []
      });
      
      if (result?.id) {
        setPageId(result.id);
        setPageName(name);
        setPageCode(code);
      }
    } catch (err) {
      console.error('自动创建页面失败', err);
    }
  }, [isNewPage, pageId]);

  // 加载已有页面或处理新建
  useEffect(() => {
    const id = searchParams.get('pageId');
    const isNew = searchParams.get('new') === 'true';
    
    if (isNew) {
      setIsNewPage(true);
      // Auto-generate name and save immediately
      const timestamp = Date.now();
      setPageName(`未命名页面-${timestamp}`);
      setPageCode(`page_${timestamp}`);
      // Will be saved on first component add or manual save
    } else if (id) {
      setIsNewPage(false);
      const loadPage = async () => {
        try {
          const data = await getPageConfig(Number(id));
          if (data?.page) {
            setPageName(data.page.name);
            setPageCode(data.page.code);
            setPageId(data.page.id);
          }
          if (data?.components && Array.isArray(data.components)) {
            const loaded = buildComponentTree(data.components);
            setComponents(loaded);
          }
        } catch (err) {
          console.error('加载页面失败', err);
        }
      };
      loadPage();
    }
  }, [searchParams]);

  // 保存到后端
  const handleSaveToBackend = async () => {
    if (!pageName.trim()) {
      showToast('请输入页面名称', 'error');
      return;
    }

    setSaving(true);
    try {
      // Debug: 打印保存时的 components 状态
      console.log('💾 [Save] 开始保存页面配置...');
      console.log('💾 [Save] pageId:', pageId);
      console.log('💾 [Save] pageName:', pageName);
      console.log('💾 [Save] pageCode:', pageCode);
      console.log('💾 [Save] components 数量:', components.length);
      console.log('💾 [Save] components 内容:', JSON.stringify(components, null, 2));

      // 扁平化组件树，保存 parentId 层级关系
      const flatComponents = flattenComponentsWithParentId(components);
      console.log('💾 [Save] 扁平化后 components:', flatComponents);

      const result = await savePageConfig({
        id: pageId || undefined,
        name: pageName,
        code: pageCode || `page_${Date.now()}`,
        components: flatComponents
      });

      console.log('💾 [Save] savePageConfig 返回结果:', result);

      if (result?.id && !pageId) {
        console.log('💾 [Save] 新建页面，设置 pageId:', result.id);
        setPageId(result.id);
        setIsNewPage(false);
        // Update URL to reflect saved page
        window.history.replaceState(null, '', `#/page-editor?pageId=${result.id}`);
      }

      console.log('💾 [Save] 保存成功！');
      showToast('保存成功！', 'success');
      navigate('/pages');
    } catch (error: any) {
      console.error('❌ [Save] 保存失败:', error);
      console.error('❌ [Save] 错误详情:', error?.response?.data || error?.message || error);
      showToast(`保存失败: ${error?.response?.data?.msg || error?.message || '请重试'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.fromPalette) {
          const newComponent: CanvasComponent = {
            id: generateId(),
            type: parsed.type,
            label: parsed.label,
            props: parsed.defaultProps || {},
          };
          
          // If this is a new page without pageId, auto-save first
          if (isNewPage && !pageId) {
            const timestamp = Date.now();
            const name = `未命名页面-${timestamp}`;
            const code = `page_${timestamp}`;
            
            savePageConfig({
              name,
              code,
              description: '',
              components: []
            }).then(result => {
              if (result?.id) {
                setPageId(result.id);
                setPageName(name);
                setPageCode(code);
                setIsNewPage(false);
                window.history.replaceState(null, '', `#/page-editor?pageId=${result.id}`);
              }
            }).catch(err => {
              console.error('自动保存页面失败', err);
            });
          }
          
          setComponents(prev => [...prev, newComponent]);
          setSelectedId(newComponent.id);
        }
      } catch (err) {
        console.error('Failed to parse drop data:', err);
      }
    }
  }, [isNewPage, pageId]);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setComponents(prev => {
      const newComponents = [...prev];
      const [removed] = newComponents.splice(fromIndex, 1);
      newComponents.splice(toIndex, 0, removed);
      return newComponents;
    });
  }, []);

  // Helper to find and update component recursively
  const updateComponentInTree = useCallback((
    components: CanvasComponent[], 
    id: string, 
    updater: (c: CanvasComponent) => CanvasComponent
  ): CanvasComponent[] => {
    return components.map(c => {
      if (c.id === id) {
        return updater(c);
      }
      if (c.children && c.children.length > 0) {
        return { ...c, children: updateComponentInTree(c.children, id, updater) };
      }
      return c;
    });
  }, []);

  // Helper to find and remove component recursively
  const removeComponentFromTree = useCallback((components: CanvasComponent[], id: string): CanvasComponent[] => {
    return components.flatMap(c => {
      if (c.id === id) return [];
      if (c.children && c.children.length > 0) {
        return [{ ...c, children: removeComponentFromTree(c.children, id) }];
      }
      return [c];
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setComponents(prev => removeComponentFromTree(prev, id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId, removeComponentFromTree]);

  const handleAddChildToContainer = useCallback((containerId: string, childComponent: CanvasComponent, tabIndex?: number) => {
    // If this is a new page without pageId, auto-save first
    if (isNewPage && !pageId) {
      const timestamp = Date.now();
      const name = `未命名页面-${timestamp}`;
      const code = `page_${timestamp}`;
      
      savePageConfig({
        name,
        code,
        description: '',
        components: []
      }).then(result => {
        if (result?.id) {
          setPageId(result.id);
          setPageName(name);
          setPageCode(code);
          setIsNewPage(false);
          window.history.replaceState(null, '', `#/page-editor?pageId=${result.id}`);
        }
      }).catch(err => {
        console.error('自动保存页面失败', err);
      });
    }
    
    setComponents(prev => updateComponentInTree(prev, containerId, comp => {
      // For tabs container, add to both children array and childrenMap
      if (comp.type === 'tabs') {
        const activeTab = tabIndex !== undefined ? tabIndex : (comp.props.activeTab as number || 0);
        const childrenMap = (comp.props.childrenMap as Record<string, string[]>) || {};
        const tabKey = String(activeTab);
        const existingChildIds = childrenMap[tabKey] || [];
        return {
          ...comp,
          children: [...(comp.children || []), childComponent],
          props: {
            ...comp.props,
            childrenMap: {
              ...childrenMap,
              [tabKey]: [...existingChildIds, childComponent.id],
            },
          },
        };
      }
      // For other containers, use children array
      return {
        ...comp,
        children: [...(comp.children || []), childComponent],
      };
    }));
    setSelectedId(childComponent.id);
  }, [isNewPage, pageId, updateComponentInTree]);

  const handleRemoveChildFromContainer = useCallback((containerId: string, childId: string) => {
    setComponents(prev => updateComponentInTree(prev, containerId, comp => {
      // For tabs container, remove from both children array and childrenMap
      if (comp.type === 'tabs') {
        const childrenMap = { ...((comp.props.childrenMap as Record<string, string[]>) || {}) };
        for (const key of Object.keys(childrenMap)) {
          childrenMap[key] = childrenMap[key].filter(id => id !== childId);
        }
        return {
          ...comp,
          children: (comp.children || []).filter(c => c.id !== childId),
          props: {
            ...comp.props,
            childrenMap,
          },
        };
      }
      // For other containers, use children array
      return {
        ...comp,
        children: (comp.children || []).filter(c => c.id !== childId),
      };
    }));
    if (selectedId === childId) {
      setSelectedId(null);
    }
  }, [updateComponentInTree, selectedId]);

  // Move child from container to root level (or to another container)
  const handleMoveChildToRoot = useCallback((fromContainerId: string, childId: string, insertIndex: number) => {
    setComponents(prev => {
      let childToMove: CanvasComponent | null = null;
      
      // Helper to find and extract child from a container
      const extractFromContainer = (comp: CanvasComponent): CanvasComponent | null => {
        if (comp.id === fromContainerId) {
          // For tabs container, get child from childrenMap
          if (comp.type === 'tabs') {
            const childrenMap = comp.props.childrenMap as Record<string, string[]> || {};
            let foundId: string | null = null;
            for (const key of Object.keys(childrenMap)) {
              const ids = childrenMap[key];
              const idx = ids.findIndex(id => id === childId || (childId === '' && insertIndex >= 0));
              if (idx !== -1) {
                foundId = ids[idx];
                childrenMap[key] = ids.filter((_, i) => i !== idx);
                break;
              }
            }
            if (foundId) {
              // Find the actual component from prev
              const findCompById = (comps: CanvasComponent[]): CanvasComponent | null => {
                for (const c of comps) {
                  if (c.id === foundId) return c;
                  if (c.children) {
                    const found = findCompById(c.children);
                    if (found) return found;
                  }
                }
                return null;
              };
              childToMove = findCompById(prev);
              return {
                ...comp,
                props: { ...comp.props, childrenMap },
              };
            }
          }
          // For other containers, use children array
          const children = comp.children || [];
          const idx = children.findIndex(c => c.id === childId || (childId === '' && insertIndex >= 0));
          if (idx !== -1) {
            childToMove = children[idx];
            return { ...comp, children: children.filter((_, i) => i !== idx) };
          }
        }
        return null;
      };
      
      // Find and extract the child from container
      let updated = prev.map(comp => {
        const result = extractFromContainer(comp);
        if (result) return result;
        
        // Also check nested containers
        if (comp.children && comp.children.length > 0) {
          const childIdx = comp.children.findIndex(c => c.id === fromContainerId);
          if (childIdx !== -1) {
            const container = comp.children[childIdx];
            const extracted = extractFromContainer(container);
            if (extracted) {
              const newChildren = [...comp.children];
              newChildren[childIdx] = extracted;
              return { ...comp, children: newChildren };
            }
          }
        }
        return comp;
      });
      
      if (!childToMove) return prev;
      
      // If insertIndex is -1 or invalid, add to end
      if (insertIndex < 0 || insertIndex >= updated.length) {
        updated = [...updated, childToMove];
      } else {
        updated.splice(insertIndex, 0, childToMove);
      }
      
      return updated;
    });
    setSelectedId(childId || null);
  }, []);

  // Helper to update a component's props by ID (recursive for nested children)
  const updateComponentProps = useCallback((components: CanvasComponent[], id: string, newProps: Record<string, unknown>): CanvasComponent[] => {
    return components.map(c => {
      if (c.id === id) {
        return { ...c, props: { ...c.props, ...newProps } };
      }
      if (c.children && c.children.length > 0) {
        return { ...c, children: updateComponentProps(c.children, id, newProps) };
      }
      return c;
    });
  }, []);

  // Flatten tree to flat list with parentId for saving
  const flattenComponentsWithParentId = (comps: CanvasComponent[], parentId: string | null = null): Record<string, unknown>[] => {
    const result: Record<string, unknown>[] = [];
    for (const c of comps) {
      const { children, ...rest } = c;
      const item: Record<string, unknown> = { ...rest };
      if (parentId) {
        item.parentId = parentId;
      }
      result.push(item);
      if (children && children.length > 0) {
        result.push(...flattenComponentsWithParentId(children, c.id));
      }
    }
    return result;
  };

  // 递归打平组件，将所有嵌套的 children 展开到根层级
  const flattenComponents = useCallback((comps: CanvasComponent[]): CanvasComponent[] => {
    const result: CanvasComponent[] = [];
    for (const comp of comps) {
      // 如果是容器组件（tabs, card, collapse），清除 childrenMap
      const isContainer = comp.type === 'tabs' || comp.type === 'card' || comp.type === 'collapse';
      result.push({ 
        ...comp, 
        children: undefined,
        props: isContainer ? { ...comp.props, childrenMap: {} } : comp.props
      });
      if (comp.children && comp.children.length > 0) {
        result.push(...flattenComponents(comp.children));
      }
    }
    return result;
  }, []);

  // 拆散所有嵌套组件
  const handleFlattenComponents = useCallback(() => {
    if (confirm('确定要拆散所有嵌套组件吗？嵌套的子组件将全部移到根层级。')) {
      setComponents(prev => flattenComponents(prev));
      setSelectedId(null);
      showToast('已拆散所有嵌套组件', 'success');
    }
  }, [flattenComponents]);

  const handleUpdateProps = useCallback((props: Record<string, unknown>) => {
    if (selectedId) {
      setComponents(prev => updateComponentProps(prev, selectedId, props));
    }
  }, [selectedId, updateComponentProps]);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="h-14 bg-[var(--bg-primary)] border-b border-[var(--border-light)] flex items-center px-4 gap-4">
        <h1 className="text-lg font-medium text-[var(--text-primary)]">
          {isNewPage ? '新建页面' : '页面编辑器'}
        </h1>
        <input
          type="text"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
          placeholder="输入页面名称"
          className="px-3 py-1.5 border border-[var(--border)] rounded text-sm w-48 bg-[var(--input-bg)] text-[var(--text-primary)]"
        />
        {/* 浮动工具栏 - 横向放在上面 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveLeftTab(activeLeftTab === 'components' ? '' : 'components')}
            className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${activeLeftTab === 'components' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            组件库
          </button>
          <button
            onClick={() => setActiveLeftTab(activeLeftTab === 'layer' ? '' : 'layer')}
            className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${activeLeftTab === 'layer' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
          >
            <Layers className="w-4 h-4" />
            组件层
          </button>
          <button
            onClick={() => selectedId && setShowPropsModal(true)}
            disabled={!selectedId}
            className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${!selectedId ? 'opacity-50 cursor-not-allowed' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
          >
            <Settings2 className="w-4 h-4" />
            属性
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">
            {components.length} 个组件
          </span>
          <button
            onClick={handleSaveToBackend}
            disabled={saving}
            className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={() => {
              if (isNewPage || !pageCode) {
                showToast('请先保存页面后再预览', 'warning');
                return;
              }
              window.open(`#/render/${pageCode}`, '_blank');
            }}
            className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            预览
          </button>
          <button
            onClick={() => {
              if (confirm('确定要清空所有组件吗？')) {
                setComponents([]);
                setSelectedId(null);
              }
            }}
            className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            清空
          </button>
          <button
            onClick={() => navigate('/pages')}
            className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            返回列表
          </button>
          <button
            onClick={handleFlattenComponents}
            className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            拆散
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 浮动面板 */}
        {(activeLeftTab === 'layer' || activeLeftTab === 'components') && (
          <div 
            className="absolute left-4 top-4 z-40 w-72 max-h-[calc(100vh-140px)] bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {activeLeftTab === 'layer' && (
              <ComponentTree
                components={components}
                selectedId={selectedId}
                onSelect={(id) => { setSelectedId(id); setShowPropsModal(true); }}
                onDelete={handleDelete}
                onMove={(dragId, dropId, position) => { console.log('Move:', dragId, 'to', dropId, position); }}
                showHeader={true}
              />
            )}
            {activeLeftTab === 'components' && (
              <div>
                {/* 添加组件按钮 */}
                <button
                  onClick={() => {
                    const newComponent: CanvasComponent = {
                      id: generateId(),
                      type: 'table',
                      label: '数据表格',
                      props: {
                        apiId: undefined,
                        queryApiId: undefined,
                        columns: [],
                        pagination: true,
                        pageSize: 10,
                        showSearch: true,
                        showAdd: false,
                        showExport: false,
                        showEdit: true,
                        showDelete: true,
                        showPagination: true,
                        showDetail: false,
                      },
                    };
                    setComponents(prev => [...prev, newComponent]);
                    setSelectedId(newComponent.id);
                    setActiveLeftTab('props');
                  }}
                  className="w-full px-3 py-2 text-xs bg-blue-500 text-white rounded-t-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加数据表格
                </button>
                <ComponentPanel 
                  onDragStart={() => { setActiveLeftTab(''); }} 
                  onQuickAdd={(comp) => {
                    const newComponent: CanvasComponent = {
                      id: generateId(),
                      type: comp.type,
                      label: comp.label,
                      props: comp.defaultProps || {},
                    };
                    setComponents(prev => [...prev, newComponent]);
                    setActiveLeftTab('');
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* 属性配置弹窗 */}
        {showPropsModal && selectedComponent && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowPropsModal(false)}
          >
            <div 
              className="bg-[var(--bg-primary)] rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h3 className="font-medium text-[var(--text-primary)]">
                  属性配置 - {selectedComponent.label}
                </h3>
                <button
                  onClick={() => setShowPropsModal(false)}
                  className="p-1 hover:bg-[var(--bg-hover)] rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <PropertyPanel
                  selectedComponent={selectedComponent}
                  components={components}
                  onUpdateProps={handleUpdateProps}
                  onMoveToContainer={(containerId, componentId, tabIndex) => {
                    const comp = findComponent(components, componentId);
                    if (comp) {
                      const parentId = findParentContainerId(components, componentId);
                      if (parentId) { handleRemoveChildFromContainer(parentId, componentId); }
                      else { setComponents(prev => prev.filter(c => c.id !== componentId)); }
                      handleAddChildToContainer(containerId, comp, tabIndex);
                    }
                  }}
                  onMoveOutOfContainer={(containerId, componentId) => {
                    handleMoveChildToRoot(containerId, componentId, -1);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <DropCanvas
          components={components}
          allComponents={components}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setShowPropsModal(true); }}
          onReorder={handleReorder}
          onDelete={handleDelete}
          onDrop={handleDrop}
          onAddChildToContainer={handleAddChildToContainer}
          onRemoveChildFromContainer={handleRemoveChildFromContainer}
          onMoveChildToRoot={handleMoveChildToRoot}
          onResize={(id, width, height) => {
            setComponents(prev => updateComponentProps(prev, id, { width, height }));
          }}
          onUpdateProps={(id, props) => {
            setComponents(prev => updateComponentProps(prev, id, props));
          }}
          onDragStart={() => setActiveLeftTab('')}
        />
      </div>
    </div>
  );
}

export default PageEditor;
