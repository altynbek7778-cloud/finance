import { useCallback, useEffect, useState } from 'react';
import type { CategoryDTO } from '@adel/shared';
import { listCategories } from '../api/workspaceApi';

export function useCategories(workspaceId: string | null) {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    listCategories(workspaceId)
      .then(setCategories)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(reload, [reload]);

  return { categories, loading, reload };
}
