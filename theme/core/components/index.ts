import { list } from './list';
import { card } from './card';
import { cssBaseline } from './css-baseline';
import { menu } from './menu';
import { chip } from './chip';
import { link } from './link';
import { tabs } from './tabs';
import { form } from './form';
import { table } from './table';
import { alert } from './alert';
import { stack } from './stack';
import { paper } from './paper';
import { badge } from './badge';
import { radio } from './radio';
import { appBar } from './appbar';
import { dialog } from './dialog';
import { avatar } from './avatar';
import { drawer } from './drawer';
import { select } from './select';
import { rating } from './rating';
import { slider } from './slider';
import { button } from './button';
import { fab } from './button-fab';
import { tooltip } from './tooltip';
import { popover } from './popover';
import { stepper } from './stepper';
import { switches } from './switch';
import { svgIcon } from './svg-icon';
import { skeleton } from './skeleton';
import { backdrop } from './backdrop';
import { progress } from './progress';
import { checkbox } from './checkbox';
import { accordion } from './accordion';
import { textfield } from './textfield';
import { typography } from './typography';
import { pagination } from './pagination';
import { breadcrumbs } from './breadcrumbs';
import { buttonGroup } from './button-group';
import { autocomplete } from './autocomplete';
import { datePicker } from './mui-x-date-picker';
import { toggleButton } from './button-toggle';

// Parked until their MUI X package is installed (see migration plan Fase 6b):
// mui-x-data-grid, mui-x-tree-view. `timeline` needs @mui/lab/themeAugmentation,
// which this migration does not install.

// ----------------------------------------------------------------------

export const components = {
  ...fab,
  ...card,
  ...link,
  ...form,
  ...tabs,
  ...chip,
  ...menu,
  ...list,
  ...stack,
  ...paper,
  ...table,
  ...alert,
  ...badge,
  ...radio,
  ...dialog,
  ...appBar,
  ...avatar,
  ...drawer,
  ...slider,
  ...rating,
  ...select,
  ...button,
  ...stepper,
  ...tooltip,
  ...popover,
  ...svgIcon,
  ...skeleton,
  ...backdrop,
  ...progress,
  ...switches,
  ...checkbox,
  ...accordion,
  ...textfield,
  ...typography,
  ...pagination,
  ...breadcrumbs,
  ...buttonGroup,
  ...autocomplete,
  ...toggleButton,
  ...datePicker,
  ...cssBaseline,
};
