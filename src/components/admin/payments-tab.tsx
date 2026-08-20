"use client";
import { authFetch } from "@/lib/auth/store";

import React, { useState, useEffect, useCallback } from "react";
import { deferEffect } from "@/lib/react/defer-effect";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  CreditCard, Plus, CheckCircle2, AlertCircle, Clock, DollarSign,
  Users, Search, RefreshCw, XCircle, CalendarDays, Loader2,
  TrendingUp, FileText, User, Wallet, Receipt, Ban, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// Types
// ============================================
interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentType: string;
  status: string;
  installmentNumber: number | null;
  totalInstallments: number | null;
  installmentPlanId: string | null;
  paymentMethod: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  student: { id: string; name: string; email: string; phone: string | null };
  enrollment: { id: string; course: { titleFa: string; titleEn: string } } | null;
  ticket: { id: string; workshop: { titleFa: string; titleEn: string } } | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  primaryInstrument: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { enrollments: number; tickets: number };
}

// ============================================
// Constants
// ============================================
const paymentTypeOptions = [
  { value: "full", labelFa: "پرداخت کامل", labelEn: "Full Payment" },
  { value: "installment", labelFa: "قسط", labelEn: "Installment" },
  { value: "partial", labelFa: "پرداخت جزئی", labelEn: "Partial Payment" },
  { value: "registration_fee", labelFa: "هزینه ثبت‌نام", labelEn: "Registration Fee" },
];

const paymentMethodOptions = [
  { value: "cash", labelFa: "نقدی", labelEn: "Cash" },
  { value: "card", labelFa: "کارتخوان", labelEn: "Card Terminal" },
  { value: "transfer", labelFa: "انتقال بانکی", labelEn: "Bank Transfer" },
  { value: "online_gateway", labelFa: "درگاه آنلاین", labelEn: "Online Gateway" },
  { value: "cheque", labelFa: "چک", labelEn: "Cheque" },
];

const statusOptions = [
  { value: "pending", labelFa: "در انتظار", labelEn: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "paid", labelFa: "پرداخت شده", labelEn: "Paid", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "overdue", labelFa: "سررسید گذشته", labelEn: "Overdue", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  { value: "cancelled", labelFa: "لغو شده", labelEn: "Cancelled", color: "bg-muted text-muted-foreground border-border" },
  { value: "refunded", labelFa: "بازپرداخت", labelEn: "Refunded", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
];

function formatPrice(amount: number, isRTL: boolean): string {
  return `${amount.toLocaleString()} ${isRTL ? "تومان" : "Toman"}`;
}

// ============================================
// Create Payment Dialog
// ============================================
function CreatePaymentDialog({
  open, onOpenChange, students, isRTL, onSave, isSaving,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  students: Student[]; isRTL: boolean;
  onSave: (data: Record<string, unknown>) => void; isSaving?: boolean;
}) {
  const [form, setForm] = useState({
    studentId: "", amount: "", paymentType: "full",
    paymentMethod: "cash", notes: "", dueDate: "",
    createInstallmentPlan: false, totalInstallments: "3",
    installmentStartDate: "",
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const data: Record<string, unknown> = {
      studentId: form.studentId,
      amount: parseInt(form.amount) || 0,
      paymentType: form.paymentType,
      paymentMethod: form.paymentMethod,
      notes: form.notes || undefined,
      dueDate: form.dueDate || undefined,
    };
    if (form.createInstallmentPlan) {
      data.createInstallmentPlan = true;
      data.totalInstallments = parseInt(form.totalInstallments) || 3;
      data.installmentStartDate = form.installmentStartDate || undefined;
    }
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRTL ? "ثبت پرداخت جدید" : "New Payment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "هنرجو" : "Student"} *</Label>
            <Select value={form.studentId} onValueChange={(v) => updateField("studentId", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب هنرجو..." : "Select student..."} /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — {s.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "مبلغ (تومان)" : "Amount (Toman)"} *</Label>
              <Input type="number" value={form.amount} onChange={(e) => updateField("amount", e.target.value)}
                className="rounded-xl" placeholder="5000000" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "نوع پرداخت" : "Payment Type"}</Label>
              <Select value={form.paymentType} onValueChange={(v) => updateField("paymentType", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{isRTL ? o.labelFa : o.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "روش پرداخت" : "Payment Method"}</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => updateField("paymentMethod", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{isRTL ? o.labelFa : o.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "تاریخ سررسید" : "Due Date"}</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => updateField("dueDate", e.target.value)}
                className="rounded-xl" dir="ltr" />
            </div>
          </div>

          {/* Installment Plan Section */}
          <Separator />
          <div className="space-y-3">
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.createInstallmentPlan} onCheckedChange={(v) => updateField("createInstallmentPlan", v)} />
              <Label className="text-sm font-medium">{isRTL ? "ایجاد طرح قسطی" : "Create Installment Plan"}</Label>
            </div>
            {form.createInstallmentPlan && (
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {isRTL ? "⚠️ مبلغ کل را وارد کنید. سیستم به طور خودکار اقساط ماهانه ایجاد می‌کند." : "⚠️ Enter total amount. System will auto-generate monthly installments."}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">{isRTL ? "تعداد اقساط" : "Installments"}</Label>
                    <Input type="number" min={2} max={12} value={form.totalInstallments}
                      onChange={(e) => updateField("totalInstallments", e.target.value)} className="rounded-xl" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{isRTL ? "تاریخ شروع قسط اول" : "First Installment Date"}</Label>
                    <Input type="date" value={form.installmentStartDate}
                      onChange={(e) => updateField("installmentStartDate", e.target.value)} className="rounded-xl" dir="ltr" />
                  </div>
                </div>
                {form.amount && form.totalInstallments && (
                  <p className="text-xs text-primary font-medium">
                    {isRTL ? `هر قسط: ${Math.round((parseInt(form.amount) || 0) / (parseInt(form.totalInstallments) || 1)).toLocaleString()} تومان` : `Each installment: ${Math.round((parseInt(form.amount) || 0) / (parseInt(form.totalInstallments) || 1)).toLocaleString()} Toman`}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">{isRTL ? "یادداشت" : "Notes"}</Label>
            <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)}
              className="rounded-xl resize-none" rows={2} dir={isRTL ? "rtl" : "ltr"} />
          </div>

          <Button onClick={handleSave} disabled={isSaving || !form.studentId || !form.amount}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            <span className="ml-2">{isRTL ? "ثبت پرداخت" : "Record Payment"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Main Payments Tab Component
// ============================================
export function PaymentsTab({ isRTL }: { isRTL: boolean }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await authFetch(`/api/admin/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || data || []);
      }
    } catch { toast.error(isRTL ? "خطا در بارگذاری" : "Failed to load"); }
    finally { setIsLoading(false); }
  }, [filterStatus, isRTL]);

  // Fetch students for dropdown — use admin endpoint with authFetch so X-Session-Token is sent
  const fetchStudents = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/students?limit=500");
      if (res.ok) {
        const data = await res.json();
        // API returns { students, total } or array
        setStudents(Array.isArray(data) ? data : (data.students || []));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    deferEffect(() => {
      fetchPayments();
      fetchStudents();
    });
  }, [fetchPayments, fetchStudents]);

  // Create payment
  const handleCreatePayment = async (data: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const res = await authFetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success(isRTL ? "پرداخت ثبت شد" : "Payment recorded");
        setIsCreateOpen(false);
        fetchPayments();
      } else {
        const err = await res.json();
        toast.error(err.error || isRTL ? "خطا در ثبت" : "Failed to record");
      }
    } catch { toast.error(isRTL ? "خطا در ارتباط" : "Connection error"); }
    finally { setIsSaving(false); }
  };

  // Mark payment as paid
  const handleMarkPaid = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paidAt: new Date().toISOString() }),
      });
      if (res.ok) { toast.success(isRTL ? "پرداخت تأیید شد" : "Payment confirmed"); fetchPayments(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  // Mark payment as overdue
  const handleMarkOverdue = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "overdue" }),
      });
      if (res.ok) { toast.success(isRTL ? "وضعیت بروزرسانی شد" : "Status updated"); fetchPayments(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  // Stats
  const totalPaid = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0);

  // Filter payments
  const filteredPayments = payments.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.student.name.toLowerCase().includes(q) && !p.student.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Group unsettled students
  const unsettledStudents = new Map<string, { name: string; totalOwed: number; totalPaid: number }>();
  payments.forEach(p => {
    if (p.status === "pending" || p.status === "overdue") {
      const existing = unsettledStudents.get(p.studentId) || { name: p.student.name, totalOwed: 0, totalPaid: 0 };
      existing.totalOwed += p.amount;
      unsettledStudents.set(p.studentId, existing);
    }
    if (p.status === "paid") {
      const existing = unsettledStudents.get(p.studentId) || { name: p.student.name, totalOwed: 0, totalPaid: 0 };
      existing.totalPaid += p.amount;
      unsettledStudents.set(p.studentId, existing);
    }
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: isRTL ? "پرداخت شده" : "Paid", value: totalPaid, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: isRTL ? "در انتظار" : "Pending", value: totalPending, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: isRTL ? "سررسید گذشته" : "Overdue", value: totalOverdue, icon: AlertCircle, color: "text-red-600", bg: "bg-red-500/10" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/30">
            <CardContent className="p-3">
              <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                </div>
              </div>
              <p className={cn("text-sm font-bold", stat.color)}>{formatPrice(stat.value, isRTL)}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        <Button onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
          <Plus className="w-4 h-4" />
          {isRTL ? "پرداخت جدید" : "New Payment"}
        </Button>
        <div className="flex-1" />
        <div className="relative flex-1 max-w-[200px]">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground", isRTL ? "right-2.5" : "left-2.5")} />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("rounded-xl h-9 text-xs", isRTL ? "pr-8" : "pl-8")}
            placeholder={isRTL ? "جستجوی هنرجو..." : "Search student..."} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="rounded-xl h-9 w-[130px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{isRTL ? o.labelFa : o.labelEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="w-9 h-9" onClick={fetchPayments}>
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Unsettled students warning */}
      {unsettledStudents.size > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-3">
            <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-600">
                {isRTL ? `${unsettledStudents.size} هنرجو تسویه نشده` : `${unsettledStudents.size} unsettled students`}
              </span>
            </div>
            <ScrollArea className="max-h-24">
              <div className="space-y-1">
                {Array.from(unsettledStudents.entries()).map(([id, data]) => (
                  <div key={id} className={cn("flex items-center justify-between text-[10px]", isRTL && "flex-row-reverse")}>
                    <span className="font-medium">{data.name}</span>
                    <span className="text-amber-600">{formatPrice(data.totalOwed - data.totalPaid, isRTL)} {isRTL ? "بدهکار" : "owed"}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Payments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{isRTL ? "پرداختی ثبت نشده" : "No payments recorded"}</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-2">
            {filteredPayments.map((payment, index) => {
              const statusConf = statusOptions.find(s => s.value === payment.status) || statusOptions[0];
              return (
                <motion.div key={payment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  <Card className="border-border/30 hover:border-primary/20 transition-all">
                    <CardContent className="p-3">
                      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                          payment.status === "paid" ? "bg-emerald-500/10" :
                          payment.status === "overdue" ? "bg-red-500/10" : "bg-amber-500/10"
                        )}>
                          {payment.status === "paid" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                           payment.status === "overdue" ? <AlertCircle className="w-4 h-4 text-red-600" /> :
                           <Clock className="w-4 h-4 text-amber-600" />}
                        </div>
                        <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <span className="text-sm font-semibold truncate">{payment.student.name}</span>
                            <Badge variant="outline" className={cn("text-[9px] border", statusConf.color)}>
                              {isRTL ? statusConf.labelFa : statusConf.labelEn}
                            </Badge>
                            {payment.installmentNumber && (
                              <Badge variant="outline" className="text-[9px]">
                                {isRTL ? `قسط ${payment.installmentNumber}/${payment.totalInstallments}` : `Inst. ${payment.installmentNumber}/${payment.totalInstallments}`}
                              </Badge>
                            )}
                          </div>
                          <div className={cn("flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5", isRTL && "flex-row-reverse")}>
                            <span className="font-medium text-foreground">{formatPrice(payment.amount, isRTL)}</span>
                            {payment.enrollment && <span>— {isRTL ? payment.enrollment.course.titleFa : payment.enrollment.course.titleEn}</span>}
                            {payment.dueDate && <span className="flex items-center gap-0.5"><CalendarDays className="w-2.5 h-2.5" />{payment.dueDate.split("T")[0]}</span>}
                          </div>
                        </div>
                        <div className={cn("flex items-center gap-1 shrink-0", isRTL && "flex-row-reverse")}>
                          {payment.status === "pending" && (
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-emerald-600 hover:bg-emerald-500/10"
                              onClick={() => handleMarkPaid(payment.id)} title={isRTL ? "تأیید پرداخت" : "Mark Paid"}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {payment.status === "pending" && payment.dueDate && new Date(payment.dueDate) < new Date() && (
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-red-600 hover:bg-red-500/10"
                              onClick={() => handleMarkOverdue(payment.id)} title={isRTL ? "علامت سررسید" : "Mark Overdue"}>
                              <AlertCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Create Payment Dialog */}
      <CreatePaymentDialog
        open={isCreateOpen} onOpenChange={setIsCreateOpen}
        students={students} isRTL={isRTL}
        onSave={handleCreatePayment} isSaving={isSaving}
      />
    </div>
  );
}
