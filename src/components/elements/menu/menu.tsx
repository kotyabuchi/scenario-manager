'use client';

import { Menu as ArkMenu, type MenuRootProps } from '@ark-ui/react/menu';

import { createStyleContext } from '@/lib/create-style-context';
import { type MenuVariantProps, menu } from '@/styled-system/recipes';

import type { ComponentPropsWithoutRef } from 'react';

const { withProvider, withContext } = createStyleContext(menu);

// Root
type RootProps = MenuRootProps & MenuVariantProps;
const Root = withProvider<HTMLDivElement, RootProps>(ArkMenu.Root, 'root');

// Trigger
type TriggerProps = ComponentPropsWithoutRef<typeof ArkMenu.Trigger>;
const Trigger = withContext<HTMLButtonElement, TriggerProps>(
  ArkMenu.Trigger,
  'trigger',
);

// Positioner
type PositionerProps = ComponentPropsWithoutRef<typeof ArkMenu.Positioner>;
const Positioner = withContext<HTMLDivElement, PositionerProps>(
  ArkMenu.Positioner,
  'positioner',
);

// Content
type ContentProps = ComponentPropsWithoutRef<typeof ArkMenu.Content>;
const Content = withContext<HTMLDivElement, ContentProps>(
  ArkMenu.Content,
  'content',
);

// Item
type ItemProps = ComponentPropsWithoutRef<typeof ArkMenu.Item>;
const Item = withContext<HTMLDivElement, ItemProps>(ArkMenu.Item, 'item');

// ItemText
type ItemTextProps = ComponentPropsWithoutRef<typeof ArkMenu.ItemText>;
const ItemText = withContext<HTMLSpanElement, ItemTextProps>(
  ArkMenu.ItemText,
  'itemText',
);

// ItemIndicator
type ItemIndicatorProps = ComponentPropsWithoutRef<
  typeof ArkMenu.ItemIndicator
>;
const ItemIndicator = withContext<HTMLSpanElement, ItemIndicatorProps>(
  ArkMenu.ItemIndicator,
  'itemIndicator',
);

// ItemGroup
type ItemGroupProps = ComponentPropsWithoutRef<typeof ArkMenu.ItemGroup>;
const ItemGroup = withContext<HTMLDivElement, ItemGroupProps>(
  ArkMenu.ItemGroup,
  'itemGroup',
);

// ItemGroupLabel
type ItemGroupLabelProps = ComponentPropsWithoutRef<
  typeof ArkMenu.ItemGroupLabel
>;
const ItemGroupLabel = withContext<HTMLSpanElement, ItemGroupLabelProps>(
  ArkMenu.ItemGroupLabel,
  'itemGroupLabel',
);

// Separator
type SeparatorProps = ComponentPropsWithoutRef<typeof ArkMenu.Separator>;
const Separator = withContext<HTMLHRElement, SeparatorProps>(
  ArkMenu.Separator,
  'separator',
);

// Arrow
type ArrowProps = ComponentPropsWithoutRef<typeof ArkMenu.Arrow>;
const Arrow = withContext<HTMLDivElement, ArrowProps>(ArkMenu.Arrow, 'arrow');

// ArrowTip
type ArrowTipProps = ComponentPropsWithoutRef<typeof ArkMenu.ArrowTip>;
const ArrowTip = withContext<HTMLDivElement, ArrowTipProps>(
  ArkMenu.ArrowTip,
  'arrowTip',
);

// Indicator (for submenu arrows etc.)
const Indicator = ArkMenu.Indicator;

// Context (for accessing menu state)
const Context = ArkMenu.Context;

// TriggerItem (for nested menus)
const TriggerItem = ArkMenu.TriggerItem;

// ContextTrigger (for right-click context menus)
const ContextTrigger = ArkMenu.ContextTrigger;

export const Menu = {
  Root,
  Trigger,
  Positioner,
  Content,
  Item,
  ItemText,
  ItemIndicator,
  ItemGroup,
  ItemGroupLabel,
  Separator,
  Arrow,
  ArrowTip,
  Indicator,
  Context,
  TriggerItem,
  ContextTrigger,
};

export type {
  RootProps as MenuRootProps,
  TriggerProps as MenuTriggerProps,
  PositionerProps as MenuPositionerProps,
  ContentProps as MenuContentProps,
  ItemProps as MenuItemProps,
  ItemTextProps as MenuItemTextProps,
  ItemIndicatorProps as MenuItemIndicatorProps,
  ItemGroupProps as MenuItemGroupProps,
  ItemGroupLabelProps as MenuItemGroupLabelProps,
  SeparatorProps as MenuSeparatorProps,
  ArrowProps as MenuArrowProps,
  ArrowTipProps as MenuArrowTipProps,
};
