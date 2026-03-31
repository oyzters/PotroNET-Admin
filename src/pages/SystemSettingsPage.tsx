import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlertIcon, SaveIcon, BellIcon, KeyIcon } from 'lucide-react';

export function SystemSettingsPage() {
    const { session, profile } = useAuth();
    const [saving, setSaving] = useState(false);

    // Dummy state for demonstration of system settings
    const [settings, setSettings] = useState({
        allowNewRegistrations: true,
        maintenanceMode: false,
        requireEmailVerification: true,
        maxReportsBeforeAutoWarn: 5,
    });

    const isSudo = profile?.role === 'sudo';

    const handleSave = async () => {
        if (!session?.access_token || !isSudo) return;
        setSaving(true);
        try {
            // Simulamos guardado en la base de datos de configuraciones (si la tuviéramos)
            await new Promise(resolve => setTimeout(resolve, 800));
            // Mostraríamos un toast de éxito aquí
        } catch { /* silent */ } finally {
            setSaving(false);
        }
    };

    if (!isSudo) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <ShieldAlertIcon className="h-16 w-16 text-destructive/50" />
                <h2 className="mt-4 text-2xl font-bold">Acceso Denegado</h2>
                <p className="mt-2 text-muted-foreground">Esta sección es exclusiva para Superusuarios (Sudo).</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Configuración del Sistema</h1>
                <p className="text-sm text-muted-foreground">Gestiona los parámetros globales de PotroNET.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-semibold">
                            <KeyIcon className="h-5 w-5 text-primary" /> 
                            Acceso y Cuentas
                        </CardTitle>
                        <CardDescription>Control general de nuevas cuentas en la red</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium">Permitir nuevos registros</h4>
                                <p className="text-xs text-muted-foreground">Los estudiantes podrán crear cuentas nuevas.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.allowNewRegistrations}
                                onChange={(e) => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium">Verificación forzosa</h4>
                                <p className="text-xs text-muted-foreground">Requerir correo verificado antes de publicar.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.requireEmailVerification}
                                onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-semibold">
                            <BellIcon className="h-5 w-5 text-amber-500" />
                            Moderación y Seguridad
                        </CardTitle>
                        <CardDescription>Umbrales de acción automática</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium block">Reportes para Advertencia Automática</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    min="1" max="100"
                                    value={settings.maxReportsBeforeAutoWarn}
                                    onChange={(e) => setSettings({ ...settings, maxReportsBeforeAutoWarn: parseInt(e.target.value) || 5 })}
                                    className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
                                />
                                <span className="text-xs text-muted-foreground">reportes.</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <h4 className="text-sm font-medium text-destructive">Modo Mantenimiento</h4>
                                <p className="text-xs text-muted-foreground">Bloquea el acceso a todos excepto Sudo.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.maintenanceMode}
                                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                className="h-4 w-4 rounded border-border text-destructive focus:ring-destructive accent-destructive"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSave} disabled={saving} className="min-w-[150px]">
                    {saving ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Guardando...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <SaveIcon className="h-4 w-4" />
                            Guardar Cambios
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}
