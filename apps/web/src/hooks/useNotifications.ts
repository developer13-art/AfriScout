import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notification.service";
import { useNotificationStore } from "../stores/notificationStore";

export function useNotifications() {
  const qc = useQueryClient();
  const setItems = useNotificationStore((s) => s.setItems);

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list(),
  });

  useEffect(() => {
    if (query.data) setItems(query.data);
  }, [query.data, setItems]);

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return { ...query, markRead, markAllRead };
}