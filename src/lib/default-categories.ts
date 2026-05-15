export type DefaultCategory = {
  name: string
  icon: string
  color: string
  type: 'EXPENSE' | 'INCOME'
}

export const DEFAULT_CATEGORIES: Record<string, DefaultCategory[]> = {
  en: [
    { name: 'Housing',        icon: 'Home',            color: '#6366f1', type: 'EXPENSE' },
    { name: 'Food',           icon: 'UtensilsCrossed', color: '#f97316', type: 'EXPENSE' },
    { name: 'Groceries',      icon: 'ShoppingCart',    color: '#f59e0b', type: 'EXPENSE' },
    { name: 'Transport',      icon: 'Car',             color: '#3b82f6', type: 'EXPENSE' },
    { name: 'Entertainment',  icon: 'Gamepad2',        color: '#a855f7', type: 'EXPENSE' },
    { name: 'Health',         icon: 'Heart',           color: '#ef4444', type: 'EXPENSE' },
    { name: 'Education',      icon: 'GraduationCap',   color: '#14b8a6', type: 'EXPENSE' },
    { name: 'Subscriptions',  icon: 'CreditCard',      color: '#ec4899', type: 'EXPENSE' },
    { name: 'Clothing',       icon: 'Shirt',           color: '#8b5cf6', type: 'EXPENSE' },
    { name: 'Pets',           icon: 'PawPrint',        color: '#d97706', type: 'EXPENSE' },
    { name: 'Gifts',          icon: 'Gift',            color: '#e11d48', type: 'EXPENSE' },
    { name: 'Travel',         icon: 'Plane',           color: '#0ea5e9', type: 'EXPENSE' },
    { name: 'Taxes',          icon: 'Receipt',         color: '#64748b', type: 'EXPENSE' },
    { name: 'Other',          icon: 'MoreHorizontal',  color: '#6b7280', type: 'EXPENSE' },
    { name: 'Salary',         icon: 'Banknote',        color: '#10b981', type: 'INCOME' },
    { name: 'Freelance',      icon: 'Laptop',          color: '#06b6d4', type: 'INCOME' },
    { name: 'Investments',    icon: 'TrendingUp',      color: '#22c55e', type: 'INCOME' },
    { name: 'Gift Received',  icon: 'Gift',            color: '#f43f5e', type: 'INCOME' },
    { name: 'Other',          icon: 'MoreHorizontal',  color: '#6b7280', type: 'INCOME' },
  ],
  'pt-BR': [
    { name: 'Moradia',           icon: 'Home',            color: '#6366f1', type: 'EXPENSE' },
    { name: 'Alimentação',       icon: 'UtensilsCrossed', color: '#f97316', type: 'EXPENSE' },
    { name: 'Mercado',           icon: 'ShoppingCart',    color: '#f59e0b', type: 'EXPENSE' },
    { name: 'Transporte',        icon: 'Car',             color: '#3b82f6', type: 'EXPENSE' },
    { name: 'Lazer',             icon: 'Gamepad2',        color: '#a855f7', type: 'EXPENSE' },
    { name: 'Saúde',             icon: 'Heart',           color: '#ef4444', type: 'EXPENSE' },
    { name: 'Educação',          icon: 'GraduationCap',   color: '#14b8a6', type: 'EXPENSE' },
    { name: 'Assinaturas',       icon: 'CreditCard',      color: '#ec4899', type: 'EXPENSE' },
    { name: 'Vestuário',         icon: 'Shirt',           color: '#8b5cf6', type: 'EXPENSE' },
    { name: 'Pets',              icon: 'PawPrint',        color: '#d97706', type: 'EXPENSE' },
    { name: 'Presentes',         icon: 'Gift',            color: '#e11d48', type: 'EXPENSE' },
    { name: 'Viagem',            icon: 'Plane',           color: '#0ea5e9', type: 'EXPENSE' },
    { name: 'Impostos',          icon: 'Receipt',         color: '#64748b', type: 'EXPENSE' },
    { name: 'Outros',            icon: 'MoreHorizontal',  color: '#6b7280', type: 'EXPENSE' },
    { name: 'Salário',           icon: 'Banknote',        color: '#10b981', type: 'INCOME' },
    { name: 'Freelance',         icon: 'Laptop',          color: '#06b6d4', type: 'INCOME' },
    { name: 'Investimentos',     icon: 'TrendingUp',      color: '#22c55e', type: 'INCOME' },
    { name: 'Presente Recebido', icon: 'Gift',            color: '#f43f5e', type: 'INCOME' },
    { name: 'Outros',            icon: 'MoreHorizontal',  color: '#6b7280', type: 'INCOME' },
  ],
}

export function getDefaultCategories(): DefaultCategory[] {
  const lang = process.env.NEXT_PUBLIC_LOCALE ?? 'en'
  return DEFAULT_CATEGORIES[lang] ?? DEFAULT_CATEGORIES['en']
}
