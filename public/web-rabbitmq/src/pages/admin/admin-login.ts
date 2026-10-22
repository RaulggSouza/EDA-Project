import type { Page } from '../../router';
import { navigate } from '../../router';
import { adminLogin, isAdminLoggedIn } from '../../state/admin-session';
import { el } from '../../ui/dom';
import { createWindow } from '../../ui/window';

const DASHBOARD_PATH = '/admin/dashboard';

export const adminLoginPage: Page = {
  render(root) {
    if (isAdminLoggedIn()) {
      navigate(DASHBOARD_PATH, true);
      return () => {};
    }

    const input = el(
      'input',
      'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-800',
    );
    input.type = 'password';
    input.placeholder = 'Senha do administrador';
    const feedback = el('p', 'h-4 text-xs text-red-600');
    const submit = el(
      'button',
      'rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white',
      'Entrar',
    );
    submit.type = 'submit';

    const form = el('form', 'flex flex-col gap-3 p-6');
    form.append(input, feedback, submit);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (adminLogin(input.value)) {
        navigate(DASHBOARD_PATH);
        return;
      }
      feedback.textContent = 'Senha incorreta';
      input.select();
    });

    const loginWindow = createWindow({ title: 'Admin', className: 'w-80' });
    loginWindow.body.append(form);
    const wrapper = el('div', 'flex h-full items-center justify-center p-6');
    wrapper.append(loginWindow.element);
    root.append(wrapper);
    input.focus();

    return () => {};
  },
};
