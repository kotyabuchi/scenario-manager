import { css, cva } from '@/styled-system/css';

// ScenarioSelectedCard styles
export const scenarioCard = css({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '4',
  p: '4',
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  borderLeft: '[4px solid]',
  borderLeftColor: 'primary.default',
});

export const scenarioCard_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  minW: '[0]',
});

export const scenarioCard_system = css({
  fontSize: 'xs',
  fontWeight: 'semibold',
  color: 'primary.text',
  bg: 'primary.subtle',
  px: '2',
  py: '0.5',
  rounded: 'sm',
  w: '[fit-content]',
});

export const scenarioCard_title = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'text.title',
  lineClamp: '[1]',
});

export const scenarioCard_meta = css({
  display: 'flex',
  gap: '3',
  mt: '1',
});

export const scenarioCard_metaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'xs',
  color: 'text.secondary',
});

export const scenarioCard_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  flexShrink: '[0]',
});

export const scenarioCard_changeLink = css({
  fontSize: 'sm',
  color: 'primary.default',
  cursor: 'pointer',
  bg: 'transparent',
  border: 'none',
  _hover: {
    textDecoration: 'underline',
  },
  _focusVisible: {
    outline: 'focusRing',
  },
});

// ScenarioSearchModal styles
export const modalBody = css({
  display: 'flex',
  flexDirection: 'column',
});

export const searchPanel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  mx: '-6',
  mt: '-6',
  px: '6',
  py: '4',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.subtle',
});

export const searchPanel_idRow = css({
  display: 'flex',
  flexDirection: { base: 'column', md: 'row' },
  alignItems: { base: 'stretch', md: 'center' },
  gap: '2',
});

export const searchPanel_idLabel = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.secondary',
  whiteSpace: 'nowrap',
});

export const searchArea = css({
  display: 'flex',
  flexDirection: { base: 'column', md: 'row' },
  gap: '3',
});

export const searchArea_stack = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const searchArea_idInput = css({
  w: 'full',
});

export const searchArea_input = css({
  flex: '[1]',
  minW: '[0]',
});

export const clearButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '6',
  h: '6',
  rounded: 'sm',
  color: 'text.secondary',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  _hover: {
    bg: 'gray.100',
    color: 'text.title',
  },
  _focusVisible: {
    outline: 'focusRing',
  },
  _disabled: {
    opacity: 'disabled',
    cursor: 'not-allowed',
    bg: 'transparent',
  },
});

export const searchArea_select = css({
  w: { base: 'full', md: '[200px]' },
  flexShrink: '[0]',
});

export const filterRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '2',
});

export const filterLabel = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.secondary',
  whiteSpace: 'nowrap',
});

export const filterChips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

export const filterChip = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    px: '3',
    py: '1.5',
    borderRadius: 'full',
    fontSize: 'sm',
    bg: 'bg.card',
    color: 'text.secondary',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border.subtle',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      bg: 'gray.50',
    },
    _focusVisible: {
      outline: 'focusRing',
    },
    _disabled: {
      opacity: 'disabled',
      cursor: 'not-allowed',
    },
    '& [data-filter-check]': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      maxW: '0',
      opacity: '[0]',
      mr: '-1.5',
      overflow: 'hidden',
      transitionProperty: '[max-width, opacity, margin]',
      transitionDuration: 'fast',
    },
  },
  variants: {
    selected: {
      true: {
        bg: 'primary.subtle',
        color: 'primary.text',
        borderColor: 'primary.default',
        _hover: {
          bg: 'primary.subtle',
        },
        '& [data-filter-check]': {
          maxW: '[16px]',
          opacity: '[1]',
          mr: '0',
        },
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
});

export const scenarioList = css({
  display: 'flex',
  flexDirection: 'column',
  maxH: '[420px]',
  overflowY: 'auto',
  mx: '-6',
  bg: 'bg.card',
});

export const scenarioList_empty = css({
  textAlign: 'center',
  color: 'text.secondary',
  px: '6',
  py: '8',
  fontSize: 'md',
});

export const scenarioList_item = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '3',
    px: '6',
    py: '4',
    cursor: 'pointer',
    bg: 'transparent',
    border: 'none',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border.subtle',
    w: 'full',
    textAlign: 'left',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      bg: 'gray.50',
    },
    _focusVisible: {
      outline: 'focusRing',
    },
    _disabled: {
      opacity: 'disabled',
      cursor: 'not-allowed',
    },
  },
  variants: {
    selected: {
      true: {
        bg: 'primary.subtle',
        _hover: {
          bg: 'primary.subtle',
        },
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
});

export const scenarioList_itemContent = css({
  flex: '[1]',
  minW: '[0]',
});

export const scenarioList_itemHeader = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  mb: '1',
  minW: '[0]',
});

export const scenarioList_itemName = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'text.title',
  lineClamp: '[1]',
});

export const scenarioList_itemSystem = css({
  fontSize: 'xs',
  color: 'text.secondary',
  bg: 'gray.100',
  px: '1.5',
  py: '0.5',
  rounded: 'sm',
  display: 'inline-block',
  flexShrink: '0',
});

export const scenarioList_itemMeta = css({
  display: 'flex',
  gap: '3',
  mt: '1',
});

export const scenarioList_itemMetaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'sm',
  color: 'text.secondary',
});

export const scenarioList_itemActions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexShrink: '[0]',
});

export const scenarioList_itemCheckIcon = cva({
  base: {
    color: 'text.secondary',
    transitionProperty: 'common',
    transitionDuration: 'fast',
  },
  variants: {
    selected: {
      true: {
        color: 'primary.default',
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
});

export const footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '2',
});
