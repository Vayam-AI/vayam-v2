"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Users,
  MessageSquare,
  UserCheck,
  UserX,
  Send,
  CheckCircle2,
  Clock,
  Activity,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoaderOne } from "@/components/ui/loader";
import { isAdminUser } from "@/lib/admin";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  registeredUsers: number;
  unregisteredUsers: number;
  totalQuestions: number;
  activeQuestions: number;
  inactiveQuestions: number;
  inviteStats: { pending: number; sent: number; accepted: number };
  totalParticipants: number;
  organization: { name: string; domain: string | null; isActive: boolean } | null;
  recentUsers: Array<{
    id: number;
    name: string;
    email: string;
    department: string | null;
    isRegistered: boolean;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = isAdminUser(session?.user?.role);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get("/api/admin/stats");
      if (res.data.success) setStats(res.data.data);
    } catch {
      console.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin, fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderOne />
      </div>
    );
  }

  if (!stats) return null;

  const registrationRate = stats.totalUsers > 0
    ? Math.round((stats.registeredUsers / stats.totalUsers) * 100)
    : 0;

  const totalInvites = stats.inviteStats.pending + stats.inviteStats.sent + stats.inviteStats.accepted;
  const acceptRate = totalInvites > 0
    ? Math.round((stats.inviteStats.accepted / totalInvites) * 100)
    : 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-1">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Dashboard
            </h1>
          </div>
          {stats.organization && (
            <div className="flex items-center gap-2 mt-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">
                {stats.organization.name}
              </span>
              {stats.organization.domain && (
                <Badge variant="outline" className="text-xs">
                  {stats.organization.domain}
                </Badge>
              )}
              <Badge
                variant={stats.organization.isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {stats.organization.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Total Users"
            value={stats.totalUsers}
            color="text-blue-600"
            bg="bg-blue-500/10"
            delay={0}
          />
          <StatCard
            icon={<MessageSquare className="h-5 w-5" />}
            label="Questions"
            value={stats.totalQuestions}
            sub={`${stats.activeQuestions} active`}
            color="text-purple-600"
            bg="bg-purple-500/10"
            delay={0.05}
          />
          <StatCard
            icon={<Send className="h-5 w-5" />}
            label="Invites Sent"
            value={stats.inviteStats.sent + stats.inviteStats.accepted}
            sub={`${stats.inviteStats.pending} pending`}
            color="text-amber-600"
            bg="bg-amber-500/10"
            delay={0.1}
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Participants"
            value={stats.totalParticipants}
            color="text-green-600"
            bg="bg-green-500/10"
            delay={0.15}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Registration Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  User Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Registration rate</span>
                  <span className="font-semibold">{registrationRate}%</span>
                </div>
                <Progress value={registrationRate} className="h-2" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-lg font-bold text-foreground">{stats.registeredUsers}</p>
                      <p className="text-xs text-muted-foreground">Registered</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg">
                    <UserX className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-lg font-bold text-foreground">{stats.unregisteredUsers}</p>
                      <p className="text-xs text-muted-foreground">Not registered</p>
                    </div>
                  </div>
                </div>
                <Link href="/admin/company-users">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Users
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Invite Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Send className="h-4 w-4 text-amber-600" />
                  Invite Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Acceptance rate</span>
                  <span className="font-semibold">{acceptRate}%</span>
                </div>
                <Progress value={acceptRate} className="h-2" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{stats.inviteStats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                    <Send className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{stats.inviteStats.sent}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{stats.inviteStats.accepted}</p>
                    <p className="text-xs text-muted-foreground">Accepted</p>
                  </div>
                </div>
                <Link href="/admin/questions">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Questions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Recently Added Users
                  </span>
                  <Link href="/admin/company-users">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No users added yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.department && (
                            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                              {u.department}
                            </Badge>
                          )}
                          {u.isRegistered ? (
                            <Badge variant="default" className="text-xs bg-green-600">
                              Registered
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Stat card component
function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  bg,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  color: string;
  bg: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-border/50 hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${bg}`}>
              <span className={color}>{icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              {sub && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
