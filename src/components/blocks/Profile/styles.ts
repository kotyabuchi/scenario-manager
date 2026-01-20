import { css } from '@/styled-system/css';

// ProfileCard用スタイル
export const card_card = css({
  bg: 'white',
  borderRadius: 'xl',
  boxShadow: 'md',
  p: '6',
});

export const card_header = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  mb: '6',
});

export const card_avatar = css({
  w: '128px',
  h: '128px',
  borderRadius: 'full',
  border: '3px solid',
  borderColor: 'gray.200',
});

export const card_info = css({
  flex: '1',
});

export const card_nickname = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'gray.900',
});

export const card_userName = css({
  fontSize: 'sm',
  color: 'gray.500',
});

export const card_divider = css({
  border: 'none',
  borderTop: '1px solid',
  borderColor: 'gray.100',
  my: '4',
});

export const card_sectionTitle = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.700',
  mb: '2',
});

export const card_bio = css({
  fontSize: 'sm',
  color: 'gray.600',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
});

export const card_meta = css({
  display: 'flex',
  gap: '6',
});

export const card_metaItem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const card_metaLabel = css({
  fontSize: 'xs',
  color: 'gray.400',
});

export const card_metaValue = css({
  fontSize: 'sm',
  color: 'gray.700',
});

export const card_editButtonWrapper = css({
  display: 'flex',
  justifyContent: 'flex-end',
  mt: '4',
});

export const card_editButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  px: '4',
  py: '2',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'primary.600',
  bg: 'transparent',
  borderRadius: 'md',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: 'none',
  _hover: {
    bg: 'primary.50',
  },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'primary.500',
    outlineOffset: '2px',
  },
});

// ProfileEditForm用スタイル
export const editForm_container = css({
  bg: 'white',
  borderRadius: 'xl',
  boxShadow: 'md',
  p: '6',
});

export const editForm_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'gray.900',
  mb: '4',
});

export const editForm_error = css({
  bg: 'red.50',
  color: 'red.700',
  p: '3',
  borderRadius: 'md',
  fontSize: 'sm',
  mb: '4',
});

export const editForm_success = css({
  bg: 'green.50',
  color: 'green.700',
  p: '3',
  borderRadius: 'md',
  fontSize: 'sm',
  mb: '4',
});

export const editForm_form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

export const editForm_field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const editForm_label = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.700',
});

export const editForm_required = css({
  color: 'red.500',
  ml: '1',
});

export const editForm_input = css({
  w: 'full',
  px: '3',
  py: '2',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: 'sm',
  outline: 'none',
  transition: 'border-color 0.2s',
  _focusVisible: {
    borderColor: 'primary.500',
    boxShadow: '0 0 0 1px var(--colors-primary-500)',
  },
  _placeholder: {
    color: 'gray.400',
  },
});

export const editForm_inputDisabled = css({
  w: 'full',
  px: '3',
  py: '2',
  border: '1px solid',
  borderColor: 'gray.200',
  borderRadius: 'md',
  fontSize: 'sm',
  bg: 'gray.50',
  color: 'gray.500',
  cursor: 'not-allowed',
});

export const editForm_textarea = css({
  w: 'full',
  px: '3',
  py: '2',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: 'sm',
  outline: 'none',
  resize: 'vertical',
  minH: '100px',
  transition: 'border-color 0.2s',
  _focusVisible: {
    borderColor: 'primary.500',
    boxShadow: '0 0 0 1px var(--colors-primary-500)',
  },
  _placeholder: {
    color: 'gray.400',
  },
});

export const editForm_hint = css({
  fontSize: 'xs',
  color: 'gray.400',
});

export const editForm_submitButton = css({
  w: 'full',
  py: '3',
  px: '4',
  bg: 'primary.600',
  color: 'primary.foreground.white',
  borderRadius: 'lg',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'background 0.2s',
  border: 'none',
  fontSize: 'md',
  mt: '2',
  _hover: {
    bg: 'primary.700',
  },
  _disabled: {
    bg: 'gray.400',
    cursor: 'not-allowed',
  },
});
