// Role-Based Access Control (RBAC) Library

export type UserRole = 'ADMIN' | 'REGISTRATION_STAFF' | 'ACCOUNTANT' | 'FOLLOW_UP_STAFF';

export interface CustomPermissions {
    dashboard?: boolean;
    applicants?: {
        view?: boolean;
        actions?: boolean;     // Access to Action Center (حجز النقل، التسعير، إلخ)
        adminView?: boolean;   // Access to administrative profile page
        create?: boolean;
        delete?: boolean;
    };
    mockExams?: {
        access?: boolean;
        sessions?: boolean;    // قسم الجلسات والنتائج
        professions?: boolean; // قسم المهن والتخصصات
        questions?: boolean;   // قسم بنك الأسئلة
        manageActions?: boolean; // إجراءات التحكم (منح محاولة، حظر)
    };
    transport?: {
        access?: boolean;
        schedule?: boolean;    // الجدولة
        destinations?: boolean; // الوجهات
        routes?: boolean;      // المسارات
        pricing?: boolean;     // التسعير
        rules?: boolean;       // قواعد التسعير
        templates?: boolean;   // قوالب الرحلات
    };
    pricing?: {
        access?: boolean;
        locations?: boolean;   // المواقع
        services?: boolean;    // الخدمات
        policies?: boolean;    // السياسات
        mockPackages?: boolean; // باقات الاختبارات التجريبية
    };
    accounting?: boolean;
    vouchers?: boolean;
    messaging?: boolean;
    settings?: boolean;
}

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
    MANAGE_SYSTEM: ['ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user role has a specific permission (legacy coarse role-based helper)
 */
export function hasPermission(userRole: UserRole | string, permission: Permission): boolean {
    const allowedRoles: readonly string[] = PERMISSIONS[permission];
    return allowedRoles.includes(userRole);
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

/**
 * Get default permissions for a role when creating a new user or fallback
 */
export function getDefaultPermissions(role: UserRole): CustomPermissions {
    const defaults: Record<UserRole, CustomPermissions> = {
        ADMIN: {
            dashboard: true,
            applicants: { view: true, actions: true, adminView: true, create: true, delete: true },
            mockExams: { access: true, sessions: true, professions: true, questions: true, manageActions: true },
            transport: { access: true, schedule: true, destinations: true, routes: true, pricing: true, rules: true, templates: true },
            pricing: { access: true, locations: true, services: true, policies: true, mockPackages: true },
            accounting: true,
            vouchers: true,
            messaging: true,
            settings: true,
        },
        REGISTRATION_STAFF: {
            dashboard: true,
            applicants: { view: true, actions: true, adminView: false, create: true, delete: false },
            mockExams: { access: true, sessions: true, professions: false, questions: false, manageActions: false },
            transport: { access: true, schedule: true, destinations: false, routes: false, pricing: false, rules: false, templates: false },
            pricing: { access: false, locations: false, services: false, policies: false, mockPackages: false },
            accounting: false,
            vouchers: true,
            messaging: true,
            settings: false,
        },
        ACCOUNTANT: {
            dashboard: true,
            applicants: { view: true, actions: true, adminView: true, create: false, delete: false },
            mockExams: { access: false, sessions: false, professions: false, questions: false, manageActions: false },
            transport: { access: false, schedule: false, destinations: false, routes: false, pricing: false, rules: false, templates: false },
            pricing: { access: true, locations: false, services: true, policies: false, mockPackages: true },
            accounting: true,
            vouchers: true,
            messaging: false,
            settings: false,
        },
        FOLLOW_UP_STAFF: {
            dashboard: true,
            applicants: { view: true, actions: true, adminView: false, create: false, delete: false },
            mockExams: { access: true, sessions: true, professions: false, questions: false, manageActions: false },
            transport: { access: true, schedule: true, destinations: false, routes: false, pricing: false, rules: false, templates: false },
            pricing: { access: false, locations: false, services: false, policies: false, mockPackages: false },
            accounting: false,
            vouchers: false,
            messaging: true,
            settings: false,
        },
    };

    return defaults[role] || defaults.REGISTRATION_STAFF;
}

/**
 * Check if a user has access to a specific granular path in their CustomPermissions.
 * E.g., hasAccess(user, 'mockExams.questions')
 */
export function hasAccess(
    user: { role: string; permissions?: any } | null | undefined,
    permissionPath: string
): boolean {
    if (!user) return false;
    
    // Admin always has full access
    if (user.role === 'ADMIN') return true;

    // Retrieve user permissions or default based on role
    const permissions: any = user.permissions || getDefaultPermissions(user.role as UserRole);

    // Resolve path (e.g. "mockExams.questions" -> permissions.mockExams?.questions)
    const parts = permissionPath.split('.');
    let current = permissions;
    
    for (const part of parts) {
        if (current === undefined || current === null) {
            return false;
        }
        current = current[part];
    }

    return !!current;
}
