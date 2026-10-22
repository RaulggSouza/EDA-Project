import type { Page } from '../../router';
import { navigate } from '../../router';
import { isAdminLoggedIn } from '../../state/admin-session';
import { el } from '../../ui/dom';
import { createDiscountWindow } from './discount-window';
import { createOrderLogWindow } from './order-log-window';

export const adminDashboardPage: Page = {
  render(root) {
    if (!isAdminLoggedIn()) {
      navigate('/admin');
      return () => {};
    }

    const logWindow = createOrderLogWindow();
    const discountWindow = createDiscountWindow();

    const grid = el(
      'div',
      'grid h-full w-full max-w-[1200px] grid-cols-1 gap-6 md:grid-cols-2',
    );
    grid.append(logWindow.element, discountWindow.element);
    const wrapper = el('div', 'flex h-full items-center justify-center p-6');
    wrapper.append(grid);
    root.append(wrapper);

    return () => {
      logWindow.dispose();
      discountWindow.dispose();
    };
  },
};
