import { useState, useEffect } from 'react';
import { webhookAPI } from '../services/api';

const WebhookEventViewer = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await webhookAPI.getEvents(10);
      setEvents(data.events);
      setError(null);
    } catch (err) {
      setError('Failed to load webhook events');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (eventType, action) => {
    if (eventType === 'pull_request') {
      if (action === 'opened') return '🔵';
      if (action === 'closed') return '✅';
      if (action === 'synchronize') return '🔄';
    }
    return '📝';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="px-7 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Recent Webhook Events
          </h3>
        </div>
        <div className="p-7">
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="px-7 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Recent Webhook Events
          </h3>
        </div>
        <div className="p-7">
          <div className="text-center py-8 text-red-600 dark:text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="px-7 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Recent Webhook Events
        </h3>
        <button
          onClick={fetchEvents}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Refresh
        </button>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {events.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No webhook events yet. Create a PR to see events here.
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getEventIcon(event.event_type, event.action)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {event.action} pull request #{event.pr_number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {event.pr_title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {event.repository_name} • by {event.sender_username}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                      {formatTimestamp(event.received_at)}
                    </span>
                  </div>
                  {event.pr_url && (
                    <a
                      href={event.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                    >
                      View on GitHub →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WebhookEventViewer;
