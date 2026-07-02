import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { skyEventTypes, type SkyEvent } from "@shared/schema";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  waiting: { label: "Waiting", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  triggered: { label: "It's Happening!", className: "bg-red-500/20 text-red-300 border-red-500/50 animate-pulse" },
  dismissed: { label: "Dismissed", className: "bg-gray-500/20 text-gray-400 border-gray-500/40" },
};

const TYPE_LABELS: Record<string, string> = {
  nova: "Nova",
  supernova: "Supernova",
  comet: "Comet",
  eclipse: "Eclipse",
  occultation: "Occultation",
  conjunction: "Conjunction",
  other: "Other",
};

const SkyEventWatchlist = () => {
  const { toast } = useToast();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [checkingId, setCheckingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    eventType: "other",
    description: "",
    aavsoName: "",
    triggerMagnitude: "",
    newsQuery: "",
    notes: "",
  });

  const { data: events, isLoading } = useQuery<SkyEvent[]>({
    queryKey: ["/api/sky-events"],
  });

  const checkMutation = useMutation({
    mutationFn: async (id: number) => {
      setCheckingId(id);
      const response = await apiRequest("POST", `/api/sky-events/${id}/check`);
      return response.json();
    },
    onSuccess: (updated: SkyEvent) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sky-events"] });
      toast({
        title: updated.status === "triggered" ? "🌟 Event triggered!" : "Check complete",
        description:
          updated.currentMagnitude != null
            ? `${updated.name} is currently at magnitude ${updated.currentMagnitude.toFixed(1)}.`
            : `Latest data refreshed for ${updated.name}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Check failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => setCheckingId(null),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sky-events", {
        name: form.name,
        eventType: form.eventType,
        description: form.description || null,
        aavsoName: form.aavsoName || null,
        triggerMagnitude: form.triggerMagnitude ? parseFloat(form.triggerMagnitude) : null,
        newsQuery: form.newsQuery || null,
        notes: form.notes || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sky-events"] });
      setOpenAddDialog(false);
      setForm({ name: "", eventType: "other", description: "", aavsoName: "", triggerMagnitude: "", newsQuery: "", notes: "" });
      toast({ title: "Event added", description: "It will be checked automatically every day." });
    },
    onError: (error) => {
      toast({
        title: "Failed to add event",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/sky-events/${id}`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sky-events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sky-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sky-events"] });
      toast({ title: "Event removed" });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl mb-8" />;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl text-space font-bold flex items-center">
          <i className="fas fa-bell mr-2 text-stellar-gold"></i>
          Anticipated Events
        </h3>
        <Button
          size="sm"
          className="bg-cosmic-purple hover:bg-cosmic-purple-light"
          onClick={() => setOpenAddDialog(true)}
        >
          <i className="fas fa-plus mr-2"></i> Add Event
        </Button>
      </div>

      {!events || events.length === 0 ? (
        <div className="bg-space-blue-light rounded-lg p-6 text-center text-star-dim text-sm">
          Watch for upcoming sky events — like a nova eruption — and get alerted when they happen.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const status = STATUS_STYLES[event.status] || STATUS_STYLES.waiting;
            return (
              <div
                key={event.id}
                className={`bg-space-blue-light rounded-lg p-4 border ${
                  event.status === "triggered" ? "border-red-500/50" : "border-transparent"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-space font-medium text-lg">{event.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-cosmic-purple/40 text-star-dim">
                        {TYPE_LABELS[event.eventType] || event.eventType}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-sm text-star-dim mt-1">{event.description}</p>
                    )}

                    {event.aavsoName && (
                      <p className="text-sm mt-2">
                        <i className="fas fa-star mr-1 text-stellar-gold"></i>
                        <span className="text-star-white">
                          {event.currentMagnitude != null
                            ? `Current brightness: mag ${event.currentMagnitude.toFixed(1)}${event.magnitudeBand ? ` (${event.magnitudeBand})` : ""}`
                            : "Brightness not checked yet"}
                        </span>
                        {event.triggerMagnitude != null && (
                          <span className="text-star-dim">
                            {" "}· alerts when brighter than mag {event.triggerMagnitude.toFixed(1)}
                          </span>
                        )}
                      </p>
                    )}

                    {event.latestNewsTitle && event.latestNewsUrl && (
                      <p className="text-sm mt-1 truncate">
                        <i className="fas fa-newspaper mr-1 text-stellar-gold"></i>
                        <a
                          href={event.latestNewsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-star-white hover:text-stellar-gold underline underline-offset-2"
                        >
                          {event.latestNewsTitle}
                        </a>
                        {event.latestNewsDate && (
                          <span className="text-star-dim">
                            {" "}({new Date(event.latestNewsDate).toLocaleDateString()})
                          </span>
                        )}
                      </p>
                    )}

                    <p className="text-xs text-star-dim mt-2">
                      {event.lastCheckedAt
                        ? `Last checked ${new Date(event.lastCheckedAt as unknown as string).toLocaleString()}`
                        : "Never checked — checks run daily, or check now"}
                      {event.newsQuery && (
                        <>
                          {" "}·{" "}
                          <a
                            href={`https://news.google.com/search?q=${encodeURIComponent(event.newsQuery)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-stellar-gold underline underline-offset-2"
                          >
                            all news
                          </a>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cosmic-purple/40 text-star-white hover:text-stellar-gold"
                      disabled={checkingId === event.id}
                      onClick={() => checkMutation.mutate(event.id)}
                    >
                      {checkingId === event.id ? (
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                      ) : (
                        <i className="fas fa-sync-alt mr-2"></i>
                      )}
                      Check Now
                    </Button>
                    {event.status === "triggered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-500/40 text-star-dim"
                        onClick={() => statusMutation.mutate({ id: event.id, status: "dismissed" })}
                      >
                        Dismiss
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-star-dim hover:text-red-500"
                      onClick={() => deleteMutation.mutate(event.id)}
                      title="Remove event"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="bg-space-blue border-cosmic-purple/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-star-white">Add Anticipated Event</DialogTitle>
            <DialogDescription className="text-star-dim">
              Track something you're waiting to see. Add an AAVSO star name to get automatic
              brightness checks, and a news query for daily headline pulls.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="event-name" className="text-star-white">Name *</Label>
              <Input
                id="event-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Comet C/2027 A1 close approach"
                className="bg-space-blue-dark border-cosmic-purple/30 text-star-white"
              />
            </div>
            <div>
              <Label className="text-star-white">Type</Label>
              <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v })}>
                <SelectTrigger className="bg-space-blue-dark border-cosmic-purple/30 text-star-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {skyEventTypes.map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="event-description" className="text-star-white">Description</Label>
              <Textarea
                id="event-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-space-blue-dark border-cosmic-purple/30 text-star-white"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="event-aavso" className="text-star-white">AAVSO star name</Label>
                <Input
                  id="event-aavso"
                  value={form.aavsoName}
                  onChange={(e) => setForm({ ...form, aavsoName: e.target.value })}
                  placeholder="e.g. T CrB"
                  className="bg-space-blue-dark border-cosmic-purple/30 text-star-white"
                />
              </div>
              <div>
                <Label htmlFor="event-trigger" className="text-star-white">Alert at magnitude ≤</Label>
                <Input
                  id="event-trigger"
                  type="number"
                  step="0.1"
                  value={form.triggerMagnitude}
                  onChange={(e) => setForm({ ...form, triggerMagnitude: e.target.value })}
                  placeholder="e.g. 7.0"
                  className="bg-space-blue-dark border-cosmic-purple/30 text-star-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="event-news" className="text-star-white">News search query</Label>
              <Input
                id="event-news"
                value={form.newsQuery}
                onChange={(e) => setForm({ ...form, newsQuery: e.target.value })}
                placeholder='e.g. "T Coronae Borealis" nova'
                className="bg-space-blue-dark border-cosmic-purple/30 text-star-white"
              />
            </div>
            <div>
              <Label htmlFor="event-notes" className="text-star-white">Notes</Label>
              <Textarea
                id="event-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-space-blue-dark border-cosmic-purple/30 text-star-white"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenAddDialog(false)}>Cancel</Button>
            <Button
              className="bg-cosmic-purple hover:bg-cosmic-purple-light"
              disabled={!form.name || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkyEventWatchlist;
