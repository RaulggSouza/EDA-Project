import './style.css';
import { emailPage } from './pages/email';
import { finishOrderPage } from './pages/finish-order';
import { servicesPage } from './pages/services';
import { startRouter } from './router';
import { startAllMonitors } from './state/service-monitor';

const root = document.getElementById('app');

if (!root) {
  throw new Error('Root element #app not found');
}

startAllMonitors();
startRouter(root, {
  '/finish-order': finishOrderPage,
  '/services': servicesPage,
  '/email': emailPage,
});
