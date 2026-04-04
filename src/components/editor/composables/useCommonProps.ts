import { computed } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'

interface Props {
  selectedComponent: CanvasComponent | null
}

export function useCommonProps(props: Props) {
  const hasProp = (key: string): boolean => {
    if (!props.selectedComponent) return false
    return key in (props.selectedComponent.props || {})
  }

  const updateProp = (key: string, value: any) => {
    if (!props.selectedComponent) return
    props.selectedComponent.props[key] = value
  }

  const updateLabel = (label: string) => {
    if (!props.selectedComponent) return
    props.selectedComponent.label = label
  }

  // 通用属性列表
  const commonProps = computed(() => {
    const comp = props.selectedComponent
    if (!comp) return []

    const props_list: { key: string; label: string }[] = [
      { key: 'placeholder', label: '占位符' },
      { key: 'options', label: '选项' },
      { key: 'value', label: '默认值' },
      { key: 'min', label: '最小值' },
      { key: 'max', label: '最大值' },
      { key: 'step', label: '步进' },
      { key: 'content', label: '内容' },
      { key: 'text', label: '文本' },
      { key: 'url', label: '链接' },
      { key: 'alt', label: 'alt文本' },
      { key: 'height', label: '高度' },
      { key: 'cols', label: '列数' },
      { key: 'rows', label: '行数' },
      { key: 'title', label: '标题' },
      { key: 'apiId', label: 'API ID' },
      { key: 'dataDictionary', label: '数据字典' },
      { key: 'tabCount', label: '标签页数' },
    ]

    return props_list.filter(p => hasProp(p.key))
  })

  return {
    hasProp,
    updateProp,
    updateLabel,
    commonProps
  }
}
