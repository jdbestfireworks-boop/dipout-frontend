import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserX,
  UserCheck,
  Search,
  Filter,
  Shield,
  Clock,
  Activity,
  DollarSign,
  Star,
  Car,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DriverRow from './DriverRow';
import { StatCard, InfoRow } from './DriverStats';

const statusColors = {
  offline: 'bg-gray-500/15 text-gray-400',
  available: 'bg-green-500/15 text-green-400',
  busy: 'bg-primary/15 text-primary',
  suspended: 'bg-red-500/15 text-red-400',
};

const approvalColors = {
  approved: 'bg-green-500/15 text-green-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  rejected: 'bg-red-500/15 text-red-400',
};

export default function DriverManagementPanel() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['admin-drivers-all'],
    queryFn: () => base44.entities.DriverProfile.list('-created_date', 500),
    refetchInterval: 15000,
  });

  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.DriverProfile.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers-all'] });
      toast.success('Driver updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update driver: ' + error.message);
    },
  });

  const handleApprove = (driver) => {
    updateDriverMutation.mutate({
      id: driver.id,
      data: { approved: true, rejection_reason: null },
    });
  };

  const handleReject = () => {
    if (!selectedDriver) return;
    updateDriverMutation.mutate({
      id: selectedDriver.id,
      data: { 
        approved: false, 
        rejection_reason: rejectionReason || 'No reason provided',
        status: 'offline'
      },
    });
    setShowRejectDialog(false);
    setRejectionReason('');
    setSelectedDriver(null);
  };

  const handleSuspend = (driver) => {
    updateDriverMutation.mutate({
      id: driver.id,
      data: { status: 'offline', suspended: true, suspension_reason: 'Manually suspended by admin' },
    });
  };

  const handleActivate = (driver) => {
    updateDriverMutation.mutate({
      id: driver.id,
      data: { status: 'available', suspended: false, suspension_reason: null },
    });
  };

  const handleRestore = (driver) => {
    updateDriverMutation.mutate({
      id: driver.id,
      data: { approved: true, status: 'available', suspended: false },
    });
  };

  const bulkApproveMutation = useMutation({
    mutationFn: async (driverIds) => {
      await Promise.all(
        driverIds.map(id =>
          base44.entities.DriverProfile.update(id, { approved: true, rejection_reason: null })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers-all'] });
      toast.success(`Approved ${selectedDrivers.length} drivers`);
      setSelectedDrivers([]);
      setSelectAll(false);
    },
  });

  const bulkDeactivateMutation = useMutation({
    mutationFn: async (driverIds) => {
      await Promise.all(
        driverIds.map(id =>
          base44.entities.DriverProfile.update(id, { status: 'offline', approved: false })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers-all'] });
      toast.success(`Deactivated ${selectedDrivers.length} drivers`);
      setSelectedDrivers([]);
      setSelectAll(false);
    },
  });

  const handleSelectDriver = (driverId) => {
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDrivers([]);
    } else {
      setSelectedDrivers(filteredDrivers.map(d => d.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkApprove = () => {
    bulkApproveMutation.mutate(selectedDrivers);
  };

  const handleBulkDeactivate = () => {
    bulkDeactivateMutation.mutate(selectedDrivers);
  };

  const openRejectDialog = (driver) => {
    setSelectedDriver(driver);
    setShowRejectDialog(true);
  };

  const openDetailsDialog = (driver) => {
    setSelectedDriver(driver);
    setShowDetailsDialog(true);
  };



  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.vehicle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.plate?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || driver.status === statusFilter;

    const matchesApproval =
      approvalFilter === 'all' ||
      (approvalFilter === 'approved' && driver.approved) ||
      (approvalFilter === 'pending' && !driver.approved);

    return matchesSearch && matchesStatus && matchesApproval;
  });

  const stats = {
    total: drivers.length,
    approved: drivers.filter((d) => d.approved).length,
    pending: drivers.filter((d) => !d.approved).length,
    active: drivers.filter((d) => d.status === 'available').length,
    busy: drivers.filter((d) => d.status === 'busy').length,
    offline: drivers.filter((d) => d.status === 'offline').length,
    suspended: drivers.filter((d) => d.suspended).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={UserCheck}
          label="Approved Drivers"
          value={stats.approved}
          subtext={`${stats.active} active, ${stats.busy} busy`}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Pending Approval"
          value={stats.pending}
          subtext="Requires review"
          color="yellow"
        />
        <StatCard
          icon={Activity}
          label="Currently Active"
          value={stats.active}
          subtext={`${stats.busy} on trip`}
          color="primary"
        />
        <StatCard
          icon={UserX}
          label="Suspended"
          value={stats.suspended}
          subtext="Not operating"
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, vehicle, or plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="w-40">
              <Shield className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Approval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Bulk Actions Bar */}
        {selectedDrivers.length > 0 && (
          <div className="px-4 py-3 bg-primary/10 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              {selectedDrivers.length} driver{selectedDrivers.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={bulkApproveMutation.isPending}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDeactivate}
                disabled={bulkDeactivateMutation.isPending}
                className="gap-2"
              >
                <UserX className="w-4 h-4" />
                Deactivate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setSelectedDrivers([]); setSelectAll(false); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-sm">
            {filteredDrivers.length} Driver{filteredDrivers.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectAll && filteredDrivers.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-border"
                  />
                </TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <DriverRow
                  key={driver.id}
                  driver={driver}
                  onApprove={handleApprove}
                  onReject={openRejectDialog}
                  onSuspend={handleSuspend}
                  onActivate={handleActivate}
                  onRestore={handleRestore}
                  onViewDetails={openDetailsDialog}
                  onSelect={handleSelectDriver}
                  isSelected={selectedDrivers.includes(driver.id)}
                />
              ))}
              {filteredDrivers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <UserX className="w-12 h-12 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground text-sm">
                        No drivers found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Details Dialog */}
      {selectedDriver && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Driver Details
              </DialogTitle>
              <DialogDescription>
                {selectedDriver.user_email}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                icon={Mail}
                label="Email"
                value={selectedDriver.user_email}
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={selectedDriver.phone || 'Not provided'}
              />
              <InfoRow
                icon={Car}
                label="Vehicle"
                value={`${selectedDriver.vehicle} (${selectedDriver.plate})`}
              />
              <InfoRow
                icon={DollarSign}
                label="Earnings Mode"
                value={
                  selectedDriver.earnings_mode === 'mile'
                    ? 'Per Mile'
                    : 'Per Hour'
                }
              />
              <InfoRow
                icon={Star}
                label="Rating"
                value={`${(selectedDriver.rating || 5).toFixed(1)} (${selectedDriver.total_ratings || 0} reviews)`}
              />
              <InfoRow
                icon={Activity}
                label="Status"
                value={
                  <Badge
                    className={cn(
                      statusColors[selectedDriver.status],
                      'capitalize'
                    )}
                  >
                    {selectedDriver.status}
                  </Badge>
                }
              />
              <InfoRow
                icon={DollarSign}
                label="Total Earnings"
                value={`$${(selectedDriver.total_earnings || 0).toFixed(2)}`}
              />
              <InfoRow
                icon={Car}
                label="Trips Completed"
                value={selectedDriver.trips_completed || 0}
              />
            </div>
            {selectedDriver.approved ? (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Approved driver</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Pending approval</span>
                {selectedDriver.rejection_reason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Rejection reason: {selectedDriver.rejection_reason}
                  </p>
                )}
              </div>
            )}
            {selectedDriver.suspended && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <XCircle className="w-4 h-4" />
                <span>Suspended: {selectedDriver.suspension_reason}</span>
              </div>
            )}
            {(selectedDriver.license_doc_url || selectedDriver.insurance_doc_url) && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </h4>
                <div className="flex gap-2">
                  {selectedDriver.license_doc_url && (
                    <a
                      href={selectedDriver.license_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      License
                    </a>
                  )}
                  {selectedDriver.insurance_doc_url && (
                    <a
                      href={selectedDriver.insurance_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      Insurance
                    </a>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              {!selectedDriver.approved && !selectedDriver.rejection_reason && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      openRejectDialog(selectedDriver);
                    }}
                  >
                    Reject
                  </Button>
                  <Button onClick={() => { handleApprove(selectedDriver); setShowDetailsDialog(false); }}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Hire Driver
                  </Button>
                </>
              )}
              {selectedDriver.approved && !selectedDriver.suspended && (
                <Button
                  variant="destructive"
                  onClick={() => { handleSuspend(selectedDriver); setShowDetailsDialog(false); }}
                >
                  Suspend
                </Button>
              )}
              {selectedDriver.suspended && (
                <Button
                  onClick={() => { handleRestore(selectedDriver); setShowDetailsDialog(false); }}
                >
                  Restore
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Reject Driver Application
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedDriver?.user_email}'s application.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full min-h-[120px] p-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}