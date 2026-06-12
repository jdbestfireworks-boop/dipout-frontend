import React from 'react';
import { Star, Car, UserX, UserCheck, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


const statusColors = {
  offline: 'bg-secondary text-secondary-foreground',
  available: 'bg-green-500/15 text-green-400',
  busy: 'bg-primary/15 text-primary',
};

const approvalColors = {
  approved: 'bg-green-500/15 text-green-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  rejected: 'bg-red-500/15 text-red-400',
};

export default function DriverRow({
  driver,
  onApprove,
  onReject,
  onSuspend,
  onActivate,
  onRestore,
  onViewDetails,
  onSelect,
  isSelected,
}) {
  const statusColor = statusColors[driver.status] || statusColors.offline;
  const approvalColor = driver.approved
    ? approvalColors.approved
    : driver.rejection_reason
    ? approvalColors.rejected
    : approvalColors.pending;

  return (
    <TableRow className={cn("hover:bg-accent/20", isSelected && "bg-primary/5")}>
      <TableCell>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect && onSelect(driver.id)}
          className="w-4 h-4 rounded border-border"
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
            {(driver.user_email?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{driver.user_email}</p>
            <p className="text-xs text-muted-foreground">
              Joined{' '}
              {driver.created_date
                ? format(new Date(driver.created_date), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p className="font-medium">{driver.vehicle || 'Not specified'}</p>
          <p className="text-xs text-muted-foreground">
            {driver.plate || 'No plate'}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 text-primary fill-primary" />
            <span>{(driver.rating || 5).toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Car className="w-3 h-3" />
            <span>{driver.trips_completed || 0} trips</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cn(statusColor, 'capitalize text-xs')}>
          {driver.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={cn(approvalColor, 'capitalize text-xs')}>
          {driver.approved ? 'Approved' : driver.rejection_reason ? 'Rejected' : 'Pending'}
        </Badge>
      </TableCell>
      <TableCell>
        <p className="font-semibold text-sm">
          ${driver.total_earnings ? driver.total_earnings.toFixed(2) : '0.00'}
        </p>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(driver)}
          >
            View
          </Button>
          {!driver.approved && !driver.rejection_reason && (
            <>
              <Button
                size="sm"
                className="h-8 bg-green-600 hover:bg-green-700"
                onClick={() => onApprove(driver)}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Hire
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-red-600 border-red-600/30 hover:bg-red-600/10"
                onClick={() => onReject(driver)}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
            </>
          )}
          {driver.approved && !driver.suspended && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-red-600 border-red-600/30 hover:bg-red-600/10"
              onClick={() => onSuspend(driver)}
            >
              <UserX className="w-3.5 h-3.5 mr-1" />
              Suspend
            </Button>
          )}
          {driver.suspended && (
            <Button
              size="sm"
              className="h-8 bg-green-600 hover:bg-green-700"
              onClick={() => onRestore(driver)}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              Restore
            </Button>
          )}
          {driver.approved && !driver.suspended && driver.status === 'offline' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => onActivate(driver)}
            >
              <Activity className="w-3.5 h-3.5 mr-1" />
              Activate
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}