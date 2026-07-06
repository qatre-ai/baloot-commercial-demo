"use client";
import { authFetch } from "@/lib/auth/store";

import React, { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Send, Mail, MailOpen, Archive, AlertCircle, Clock,
  MessageSquare, Plus, ChevronLeft, ChevronRight, Loader2,
  Star, Eye, Check
} from "lucide-react";

interface AdminMessage {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  priority: string;
  status: string;
  isSystemMessage: boolean;
  readAt: string | null;
  parentMessageId: string | null;
  createdAt: string;
  sender: { id: string; name: string; email: string; role: string; avatarUrl?: string | null };
  recipient: { id: string; name: string; email: string; role: string; avatarUrl?: string | null };
}

interface AdminOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function AdminMessagesTab() {
  const { isRTL } = useI18n();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "received" | "sent" | "unread">("all");
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [admins, setAdmins] = useState<AdminOption[]>([]);

  // Compose form
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [composePriority, setComposePriority] = useState("normal");
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/admin/admin-messages?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { toast.error(isRTL ? "خطا در بارگذاری پیام‌ها" : "Failed to load messages"); }
    finally { setIsLoading(false); }
  }, [filter, isRTL]);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins((data.admins || []).map((a: AdminOption) => ({ id: a.id, name: a.name, email: a.email, role: a.role })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchMessages(); fetchAdmins(); }, [fetchMessages, fetchAdmins]);

  const handleMarkAsRead = async (msg: AdminMessage) => {
    if (msg.status === "read") return;
    try {
      const res = await authFetch("/api/admin/admin-messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id, status: "read" }),
      });
      if (res.ok) {
        fetchMessages();
        toast.success(isRTL ? "پیام خوانده شد" : "Message marked as read");
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const handleSendMessage = async () => {
    if (!composeTo || !composeContent) {
      toast.error(isRTL ? "گیرنده و متن پیام الزامی است" : "Recipient and content are required");
      return;
    }
    setIsSending(true);
    try {
      const res = await authFetch("/api/admin/admin-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: composeTo,
          subject: composeSubject,
          content: composeContent,
          priority: composePriority,
        }),
      });
      if (res.ok) {
        toast.success(isRTL ? "پیام ارسال شد" : "Message sent");
        setShowCompose(false);
        setComposeTo(""); setComposeSubject(""); setComposeContent(""); setComposePriority("normal");
        fetchMessages();
      } else {
        const data = await res.json();
        toast.error(data.error || (isRTL ? "خطا در ارسال" : "Failed to send"));
      }
    } catch { toast.error(isRTL ? "خطا در ارتباط" : "Connection error"); }
    finally { setIsSending(false); }
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; color: string }> = {
      low: { label: isRTL ? "کم" : "Low", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
      normal: { label: isRTL ? "عادی" : "Normal", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      high: { label: isRTL ? "مهم" : "High", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      urgent: { label: isRTL ? "فوری" : "Urgent", color: "bg-red-500/10 text-red-600 border-red-500/20" },
    };
    const c = config[priority] || config.normal;
    return <Badge variant="outline" className={cn("text-[10px] border", c.color)}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      sent: { label: isRTL ? "ارسال شده" : "Sent", color: "bg-blue-500/10 text-blue-600", icon: Send },
      delivered: { label: isRTL ? "تحویل داده شده" : "Delivered", color: "bg-cyan-500/10 text-cyan-600", icon: Check },
      read: { label: isRTL ? "خوانده شده" : "Read", color: "bg-emerald-500/10 text-emerald-600", icon: MailOpen },
      archived: { label: isRTL ? "بایگانی" : "Archived", color: "bg-slate-500/10 text-slate-600", icon: Archive },
    };
    const c = config[status] || config.sent;
    return <Badge variant="outline" className={cn("text-[10px]", c.color)}>{c.label}</Badge>;
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return isRTL ? "الان" : "Now";
    if (mins < 60) return isRTL ? `${mins} دقیقه پیش` : `${mins}m ago`;
    if (hours < 24) return isRTL ? `${hours} ساعت پیش` : `${hours}h ago`;
    return isRTL ? `${days} روز پیش` : `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn("flex items-center justify-between gap-3", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{isRTL ? "پیام‌های داخلی" : "Internal Messages"}</h3>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white text-[10px]">{unreadCount} {isRTL ? "خوانده‌نشده" : "unread"}</Badge>
          )}
        </div>
        <Button size="sm" onClick={() => setShowCompose(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          {isRTL ? "پیام جدید" : "New Message"}
        </Button>
      </div>

      {/* Filters */}
      <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
        {(["all", "received", "sent", "unread"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilter(f); setSelectedMessage(null); }}
            className="text-xs"
          >
            {f === "all" ? (isRTL ? "همه" : "All") :
             f === "received" ? (isRTL ? "دریافتی" : "Received") :
             f === "sent" ? (isRTL ? "ارسالی" : "Sent") :
             (isRTL ? "خوانده‌نشده" : "Unread")}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : messages.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{isRTL ? "پیامی یافت نشد" : "No messages found"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Message List */}
          <div className="lg:col-span-1">
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-1">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (msg.recipientId && msg.status !== "read") handleMarkAsRead(msg);
                    }}
                    className={cn(
                      "w-full text-start p-3 rounded-lg border transition-colors",
                      selectedMessage?.id === msg.id
                        ? "bg-primary/10 border-primary/30"
                        : "border-border/30 hover:bg-muted/50",
                      msg.status !== "read" && msg.recipientId && "bg-primary/5"
                    )}
                  >
                    <div className={cn("flex items-center justify-between gap-2", isRTL && "flex-row-reverse")}>
                      <span className="text-xs font-medium truncate">
                        {isRTL ? msg.sender.name : msg.sender.name}
                        <span className="text-muted-foreground mx-1">→</span>
                        {isRTL ? msg.recipient.name : msg.recipient.name}
                      </span>
                      {getPriorityBadge(msg.priority)}
                    </div>
                    <p className="text-xs font-medium mt-1 truncate">{msg.subject}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{msg.content}</p>
                    <div className={cn("flex items-center gap-2 mt-1.5", isRTL && "flex-row-reverse")}>
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{formatTimeAgo(msg.createdAt)}</span>
                      {getStatusBadge(msg.status)}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card className="border-border/30">
                <CardHeader className="pb-3">
                  <div className={cn("flex items-start justify-between gap-3", isRTL && "flex-row-reverse")}>
                    <div>
                      <CardTitle className="text-sm font-semibold">{selectedMessage.subject}</CardTitle>
                      <div className={cn("flex items-center gap-3 mt-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                        <span>{isRTL ? "از:" : "From:"} {selectedMessage.sender.name} ({selectedMessage.sender.email})</span>
                        <span>{isRTL ? "به:" : "To:"} {selectedMessage.recipient.name} ({selectedMessage.recipient.email})</span>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      {getPriorityBadge(selectedMessage.priority)}
                      {getStatusBadge(selectedMessage.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-3" />
                  <div className={cn("text-sm whitespace-pre-wrap leading-relaxed", isRTL && "text-right")}>
                    {selectedMessage.content}
                  </div>
                  <Separator className="my-3" />
                  <div className={cn("flex items-center gap-4 text-[11px] text-muted-foreground", isRTL && "flex-row-reverse")}>
                    <span>{new Date(selectedMessage.createdAt).toLocaleString(isRTL ? "fa-IR" : "en-US")}</span>
                    {selectedMessage.readAt && (
                      <span>{isRTL ? "خوانده شده:" : "Read:"} {new Date(selectedMessage.readAt).toLocaleString(isRTL ? "fa-IR" : "en-US")}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/30">
                <CardContent className="py-20 text-center text-muted-foreground">
                  <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{isRTL ? "یک پیام را برای مشاهده انتخاب کنید" : "Select a message to view"}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className={cn("max-w-lg", isRTL && "text-right")}>
          <DialogHeader>
            <DialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Send className="w-4 h-4" />
              {isRTL ? "پیام جدید" : "New Message"}
            </DialogTitle>
            <DialogDescription className="sr-only">فرم ارسال پیام جدید به مدیران</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">{isRTL ? "گیرنده" : "Recipient"} *</Label>
              <Select value={composeTo} onValueChange={setComposeTo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={isRTL ? "انتخاب گیرنده..." : "Select recipient..."} />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.email}) - {a.role === "super_admin" ? "سوپر ادمین" : "ادمین"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{isRTL ? "موضوع" : "Subject"}</Label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder={isRTL ? "موضوع پیام..." : "Message subject..."}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{isRTL ? "اولویت" : "Priority"}</Label>
              <Select value={composePriority} onValueChange={setComposePriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{isRTL ? "کم" : "Low"}</SelectItem>
                  <SelectItem value="normal">{isRTL ? "عادی" : "Normal"}</SelectItem>
                  <SelectItem value="high">{isRTL ? "مهم" : "High"}</SelectItem>
                  <SelectItem value="urgent">{isRTL ? "فوری" : "Urgent"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{isRTL ? "متن پیام" : "Message Content"} *</Label>
              <Textarea
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                placeholder={isRTL ? "متن پیام خود را بنویسید..." : "Write your message..."}
                rows={6}
                className="mt-1"
              />
            </div>
            <div className={cn("flex justify-end gap-2", isRTL && "flex-row-reverse")}>
              <Button variant="outline" onClick={() => setShowCompose(false)}>{isRTL ? "انصراف" : "Cancel"}</Button>
              <Button onClick={handleSendMessage} disabled={isSending} className="gap-1.5">
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isRTL ? "ارسال" : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
