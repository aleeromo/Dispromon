import { useAuth } from '../context/AuthContext';

const ROLES = ['ADMIN', 'VENTAS', 'DISENO', 'TALLER'];

/**
 * Hook para lógica de roles en la UI.
 * @returns { { user, role, isAdmin, isVentas, isDiseno, isTaller, canSeePresupuesto } }
 */
export function useRole() {
  const { user } = useAuth();
  const role = user?.rol ?? null;
  return {
    user,
    role,
    isAdmin: role === 'ADMIN',
    isVentas: role === 'VENTAS',
    isDiseno: role === 'DISENO',
    isTaller: role === 'TALLER',
    /** Ejemplo: ocultar columna Presupuesto para rol TALLER */
    canSeePresupuesto: role !== 'TALLER',
    hasRole: (...roles) => (role ? roles.includes(role) : false),
  };
}

export { ROLES };
