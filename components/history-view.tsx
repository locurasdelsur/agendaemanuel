'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface HistoryRecord {
  timestamp: string;
  type: string;
  itemId: string;
  action: string;
  fieldModified: string;
  oldValue: any;
  newValue: any;
  details: string;
}

interface HistoryViewProps {
  type?: string;
  itemId?: string;
  limit?: number;
  refreshTrigger?: number;
}

export function HistoryView({ type, itemId, limit = 50, refreshTrigger }: HistoryViewProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = `${API_URL}?action=getHistory&limit=${limit}`;
      if (type) url += `&type=${type}`;
      if (itemId) url += `&itemId=${itemId}`;

      const response = await fetch(url);
      const result = await response.json();

      if (Array.isArray(result)) {
        setHistory(result);
      } else if (result.success === false) {
        setError('Error al obtener el historial');
      }
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [type, itemId, limit, refreshTrigger]);

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'note': 'bg-blue-50 border-blue-200',
      'reminder': 'bg-yellow-50 border-yellow-200',
      'category': 'bg-purple-50 border-purple-200',
      'import': 'bg-green-50 border-green-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      'create': 'bg-green-100 text-green-700',
      'update': 'bg-blue-100 text-blue-700',
      'delete': 'bg-red-100 text-red-700',
      'complete': 'bg-purple-100 text-purple-700',
      'import': 'bg-green-100 text-green-700'
    };
    return colors[action] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Cargando historial...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No hay cambios registrados en el historial
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((record, index) => (
        <Card
          key={index}
          className={`p-4 border-l-4 ${getTypeColor(record.type)}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded ${getActionColor(record.action)}`}>
                  {record.action.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">{record.type}</span>
              </div>
              
              <p className="font-medium text-sm break-words">{record.fieldModified}</p>
              
              {record.details && (
                <p className="text-sm text-gray-600 mt-1">{record.details}</p>
              )}

              {record.oldValue !== null && record.newValue !== null && (
                <div className="mt-2 text-xs space-y-1">
                  <div className="flex gap-2">
                    <span className="font-medium text-red-700">Anterior:</span>
                    <span className="text-gray-700 break-words">
                      {typeof record.oldValue === 'object' 
                        ? JSON.stringify(record.oldValue) 
                        : String(record.oldValue)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-green-700">Nuevo:</span>
                    <span className="text-gray-700 break-words">
                      {typeof record.newValue === 'object' 
                        ? JSON.stringify(record.newValue) 
                        : String(record.newValue)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-right text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
              <div>{formatDate(record.timestamp)}</div>
              <div className="text-gray-400 mt-1 font-mono text-[10px]">
                {record.itemId?.substring(0, 8)}...
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
