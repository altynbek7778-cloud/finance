import { useState } from 'react';
import { getVapidPublicKey, registerPushSubscription } from '../api/pushApi';
import { subscribeToPush, isIos, isStandalone } from '../lib/push';
import { useToast } from '../state/ToastContext';

const DISMISS_KEY = 'adel_notify_dismissed';

export function NotifyCard({ workspaceId }: { workspaceId: string }) {
  const showToast = useToast();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const [loading, setLoading] = useState(false);

  if (dismissed || permission === 'unsupported' || permission === 'granted' || permission === 'denied') {
    return null;
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  const iosNeedsInstall = isIos() && !isStandalone();

  async function enable() {
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        const { publicKey } = await getVapidPublicKey();
        const sub = await subscribeToPush(publicKey);
        await registerPushSubscription(workspaceId, sub);
        showToast('Уведомления включены');
      }
    } catch {
      showToast('Не удалось включить уведомления');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="notify-card">
      <div className="notify-card-title">
        <i className="ti ti-bell-ringing" /> Уведомления
      </div>
      {iosNeedsInstall ? (
        <div className="notify-card-desc">
          Чтобы получать уведомления на iPhone, сначала добавьте приложение на экран «Домой» через
          Safari → Поделиться → «На экран Домой», затем откройте его оттуда.
        </div>
      ) : (
        <>
          <div className="notify-card-desc">
            Узнавайте, когда партнёр добавляет операцию или превышен лимит бюджета.
          </div>
          <div className="notify-card-actions">
            <button className="ai-ok" onClick={enable} disabled={loading}>
              {loading ? 'Включаем…' : 'Включить'}
            </button>
            <button className="ai-cancel" onClick={dismiss}>
              Не сейчас
            </button>
          </div>
        </>
      )}
      {iosNeedsInstall && (
        <div className="notify-card-actions">
          <button className="ai-cancel" onClick={dismiss}>
            Понятно
          </button>
        </div>
      )}
    </div>
  );
}
