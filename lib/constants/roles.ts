import { UserRole } from "@prisma/client";

export interface RolePermissions {
  canPost: boolean;
  canReply: boolean;
  canLike: boolean;
  canReport: boolean;
  canEditOwnPost: boolean;
  canDeleteOwnPost: boolean;
  canEditAnyPost: boolean;
  canDeleteAnyPost: boolean;
  canPinPost: boolean;
  canFeaturePost: boolean;
  canLockPost: boolean;
  canMovePost: boolean;
  canBanUser: boolean;
  canMuteUser: boolean;
  canManageForums: boolean;
  canManageUsers: boolean;
  canViewAdminPanel: boolean;
  canManageReports: boolean;
  canAdjustPoints: boolean;
  canViewLogs: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  USER: {
    canPost: true,
    canReply: true,
    canLike: true,
    canReport: true,
    canEditOwnPost: true,
    canDeleteOwnPost: true,
    canEditAnyPost: false,
    canDeleteAnyPost: false,
    canPinPost: false,
    canFeaturePost: false,
    canLockPost: false,
    canMovePost: false,
    canBanUser: false,
    canMuteUser: false,
    canManageForums: false,
    canManageUsers: false,
    canViewAdminPanel: false,
    canManageReports: false,
    canAdjustPoints: false,
    canViewLogs: false,
  },
  MODERATOR: {
    canPost: true,
    canReply: true,
    canLike: true,
    canReport: true,
    canEditOwnPost: true,
    canDeleteOwnPost: true,
    canEditAnyPost: true,
    canDeleteAnyPost: true,
    canPinPost: true,
    canFeaturePost: true,
    canLockPost: true,
    canMovePost: true,
    canBanUser: false,
    canMuteUser: true,
    canManageForums: false,
    canManageUsers: false,
    canViewAdminPanel: false,
    canManageReports: true,
    canAdjustPoints: false,
    canViewLogs: false,
  },
  ADMIN: {
    canPost: true,
    canReply: true,
    canLike: true,
    canReport: true,
    canEditOwnPost: true,
    canDeleteOwnPost: true,
    canEditAnyPost: true,
    canDeleteAnyPost: true,
    canPinPost: true,
    canFeaturePost: true,
    canLockPost: true,
    canMovePost: true,
    canBanUser: true,
    canMuteUser: true,
    canManageForums: true,
    canManageUsers: true,
    canViewAdminPanel: true,
    canManageReports: true,
    canAdjustPoints: true,
    canViewLogs: true,
  },
  SUPER_ADMIN: {
    canPost: true,
    canReply: true,
    canLike: true,
    canReport: true,
    canEditOwnPost: true,
    canDeleteOwnPost: true,
    canEditAnyPost: true,
    canDeleteAnyPost: true,
    canPinPost: true,
    canFeaturePost: true,
    canLockPost: true,
    canMovePost: true,
    canBanUser: true,
    canMuteUser: true,
    canManageForums: true,
    canManageUsers: true,
    canViewAdminPanel: true,
    canManageReports: true,
    canAdjustPoints: true,
    canViewLogs: true,
  },
} as const;

/**
 * 取得角色權限
 */
export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

/**
 * 檢查角色是否有特定權限
 */
export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * 角色顯示名稱
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  USER: "一般會員",
  MODERATOR: "版主",
  ADMIN: "管理員",
  SUPER_ADMIN: "超級管理員",
};
