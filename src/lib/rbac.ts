// Role-Based Access Control (RBAC) Library

export type UserRole = 'ADMIN' | 'REGISTRATION_STAFF' | 'ACCOUNTANT' | 'FOLLOW_UP_STAFF';

export const PERMISSIONS = {
    // User Management
    MANAGE_USERS: ['ADMIN'],

    // Applicants
    CREATE_APPLICANTS: ['ADMIN', 'REGISTRATION_STAFF'],
    VIEW_APPLICANTS: ['ADMIN', 'REGISTRATION_STAFF', 'ACCOUNTANT', 'FOLLOW_UP_STAFF'],
    EDIT_APPLICANTS: ['ADMIN', 'REGISTRATION_STAFF', 'FOLLOW_UP_STAFF'],
    DELETE_APPLICANTS: ['ADMIN'],

    // Accounting
    VIEW_ACCOUNTING: ['ADMIN', 'ACCOUNTANT'],
    MANAGE_TRANSACTIONS: ['ADMIN', 'ACCOUNTANT'],

    // Pricing
    MANAGE_PRICING: ['ADMIN'],

    // Settings
    ACCESS_SETTINGS: ['ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: UserRole | string, permission: Permission): boolean {
    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles.includes(userRole as UserRole);
}

/**
 * Get user-friendly role name in Arabic
 */
export function getRoleLabel(role: UserRole | string): string {
    const labels: Record<UserRole, string> = {
        ADMIN: 'مدير النظام',
        REGISTRATION_STAFF: 'موظف تسجيل',
        ACCOUNTANT: 'محاسب',
        FOLLOW_UP_STAFF: 'موظف متابعة',
    };
    return labels[role as UserRole] || role;
}

/**
 * Get all available roles
 */
export function getAllRoles(): { value: UserRole; label: string }[] {
    return [
        { value: 'ADMIN', label: 'مدير النظام' },
        { value: 'REGISTRATION_STAFF', label: 'موظف تسجيل' },
        { value: 'ACCOUNTANT', label: 'محاسب' },
        { value: 'FOLLOW_UP_STAFF', label: 'موظف متابعة' },
    ];
}
