const messages = {
  nav: {
    home: 'Home',
    transactions: 'Transactions',
    recurring: 'Recurring',
    goals: 'Goals',
    projections: 'Projections',
    admin: 'Admin',
  },
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    create: 'Create',
    edit: 'Edit',
    loading: 'Loading…',
    saving: 'Saving…',
    creating: 'Creating…',
    error: 'Something went wrong',
    accessDenied: 'Access denied',
  },
  admin: {
    title: 'Admin',
    users: 'Users',
    profiles: 'Profiles',
    household: 'Household',
    newUser: 'New user',
    newProfile: 'New profile',
    createUser: 'Create user',
    createProfile: 'Create profile',
    resetPassword: 'Reset password',
    username: 'Username',
    displayName: 'Display name',
    displayNameOptional: 'Display name (optional)',
    password: 'Password',
    newPassword: 'New password',
    isAdmin: 'Admin',
    householdName: 'Household name',
    user: 'User',
    selectUser: 'Select user…',
    usersCount: (n: number) => `${n} user${n === 1 ? '' : 's'}`,
    profilesCount: (n: number) => `${n} profile${n === 1 ? '' : 's'}`,
    confirmDeleteUser: 'Delete this user and all their data?',
    confirmDeleteProfile: 'Delete this profile and all its data?',
    cannotDeleteSelf: 'Cannot delete your own account',
    usernameTaken: 'Username already taken',
    youBadge: 'you',
    adminBadge: 'admin',
  },
  setup: {
    title: 'Setup',
    householdName: 'Household name',
    adminName: 'Your name',
    username: 'Username',
    password: 'Password',
    confirmPassword: 'Confirm password',
    submit: 'Create household',
    passwordMismatch: 'Passwords do not match',
  },
  login: {
    title: 'Sign in',
    username: 'Username',
    password: 'Password',
    submit: 'Sign in',
    invalid: 'Invalid username or password',
  },
} as const

export default messages

// Recursively replace string literals with string, keeping function signatures intact.
type Loosen<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : T[K] extends string
    ? string
    : Loosen<T[K]>
}

export type Messages = Loosen<typeof messages>
