import { useEffect, useState, useCallback, Fragment } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { PlusIcon, Trash2Icon, PencilIcon, CheckIcon, XIcon, BookOpenIcon } from 'lucide-react';

interface Career { id: string; name: string }
interface Subject { id: string; career_id: string; name: string; semester: number; credits: number }

export function SubjectsPage() {
    const { session } = useAuth();
    const toast = useToast();
    const [careers, setCareers] = useState<Career[]>([]);
    const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', semester: 1, credits: 0 });
    const [newForm, setNewForm] = useState({ name: '', semester: 1, credits: 0 });
    const [showNewRow, setShowNewRow] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);

    useEffect(() => {
        if (!session?.access_token) return;
        api<{ careers: Career[] }>('/careers', { token: session.access_token })
            .then(d => setCareers(d.careers))
            .catch((e) => toast.error(e instanceof Error ? e.message : 'No se pudieron cargar las carreras'));
    }, [session?.access_token, toast]);

    const fetchSubjects = useCallback(async (career: Career) => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const data = await api<{ subjects: Subject[] }>(
                `/admin/subjects?career_id=${career.id}`,
                { token: session.access_token }
            );
            setSubjects(data.subjects);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al cargar materias');
        } finally {
            setLoading(false);
        }
    }, [session?.access_token, toast]);

    const handleSelectCareer = (career: Career) => {
        setSelectedCareer(career);
        setShowNewRow(false);
        setEditingId(null);
        setPendingDelete(null);
        fetchSubjects(career);
    };

    const handleAdd = async () => {
        if (!session?.access_token || !selectedCareer || !newForm.name.trim()) return;
        setSaving(true);
        try {
            const data = await api<{ subject: Subject }>('/admin/subjects', {
                method: 'POST',
                token: session.access_token,
                body: JSON.stringify({ career_id: selectedCareer.id, ...newForm }),
            });
            setSubjects(prev =>
                [...prev, data.subject].sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name))
            );
            setNewForm({ name: '', semester: 1, credits: 0 });
            setShowNewRow(false);
            toast.success('Materia agregada');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al agregar materia');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEdit = async (id: string) => {
        if (!session?.access_token) return;
        setSaving(true);
        try {
            const data = await api<{ subject: Subject }>('/admin/subjects', {
                method: 'PATCH',
                token: session.access_token,
                body: JSON.stringify({ id, ...editForm }),
            });
            setSubjects(prev =>
                prev.map(s => s.id === id ? data.subject : s)
                    .sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name))
            );
            setEditingId(null);
            toast.success('Materia actualizada');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!session?.access_token) return;
        // Two-step inline confirm: first click sets pendingDelete, second click actually deletes
        if (pendingDelete !== id) {
            setPendingDelete(id);
            window.setTimeout(() => setPendingDelete((current) => current === id ? null : current), 4000);
            return;
        }
        try {
            await api(`/admin/subjects?id=${id}`, { method: 'DELETE', token: session.access_token });
            setSubjects(prev => prev.filter(s => s.id !== id));
            setPendingDelete(null);
            toast.success('Materia eliminada');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al eliminar materia');
        }
    };

    const semesters: Record<number, Subject[]> = {};
    subjects.forEach(s => {
        if (!semesters[s.semester]) semesters[s.semester] = [];
        semesters[s.semester].push(s);
    });
    const semesterNumbers = Object.keys(semesters).map(Number).sort((a, b) => a - b);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Materias por Carrera</h1>
                <p className="text-sm text-muted-foreground">Gestiona el plan de estudios de cada carrera</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {careers.map(career => (
                    <button
                        key={career.id}
                        onClick={() => handleSelectCareer(career)}
                        className={`rounded-xl border p-4 text-left text-sm font-medium transition-colors ${
                            selectedCareer?.id === career.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-card text-foreground hover:bg-accent'
                        }`}
                    >
                        <BookOpenIcon className="mb-2 h-5 w-5 opacity-60" />
                        {career.name}
                    </button>
                ))}
            </div>

            {!selectedCareer && (
                <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                    Selecciona una carrera para ver y gestionar sus materias
                </div>
            )}

            {selectedCareer && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{selectedCareer.name}</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{subjects.length} materias</span>
                            <button
                                onClick={() => { setShowNewRow(true); setEditingId(null); setPendingDelete(null); }}
                                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Agregar materia
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-accent/30">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Materia</th>
                                        <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Semestre</th>
                                        <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Créditos</th>
                                        <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {showNewRow && (
                                        <tr className="border-b border-border bg-primary/5">
                                            <td className="px-4 py-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Nombre de la materia"
                                                    value={newForm.name}
                                                    onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                                                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowNewRow(false); }}
                                                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number" min={1} max={12}
                                                    value={newForm.semester}
                                                    onChange={e => setNewForm(f => ({ ...f, semester: Number(e.target.value) }))}
                                                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number" min={0}
                                                    value={newForm.credits}
                                                    onChange={e => setNewForm(f => ({ ...f, credits: Number(e.target.value) }))}
                                                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={handleAdd}
                                                        disabled={saving || !newForm.name.trim()}
                                                        className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-40"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setShowNewRow(false)}
                                                        className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                                                    >
                                                        <XIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {subjects.length === 0 && !showNewRow ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                                                No hay materias. Agrega la primera.
                                            </td>
                                        </tr>
                                    ) : (
                                        semesterNumbers.map(sem => (
                                            <Fragment key={`sem-${sem}`}>
                                                <tr className="bg-accent/20">
                                                    <td colSpan={4} className="px-4 py-1.5 text-xs font-semibold text-muted-foreground">
                                                        Semestre {sem}
                                                    </td>
                                                </tr>
                                                {semesters[sem].map(subject => {
                                                    const isPending = pendingDelete === subject.id;
                                                    return (
                                                        <tr key={subject.id} className="group border-b border-border last:border-0 hover:bg-accent/20">
                                                            <td className="px-4 py-2.5">
                                                                {editingId === subject.id ? (
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        value={editForm.name}
                                                                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(subject.id); if (e.key === 'Escape') setEditingId(null); }}
                                                                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                                                                    />
                                                                ) : (
                                                                    <span className="text-sm">{subject.name}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                {editingId === subject.id ? (
                                                                    <input
                                                                        type="number" min={1} max={12}
                                                                        value={editForm.semester}
                                                                        onChange={e => setEditForm(f => ({ ...f, semester: Number(e.target.value) }))}
                                                                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                                                                    />
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">{subject.semester}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                {editingId === subject.id ? (
                                                                    <input
                                                                        type="number" min={0}
                                                                        value={editForm.credits}
                                                                        onChange={e => setEditForm(f => ({ ...f, credits: Number(e.target.value) }))}
                                                                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                                                                    />
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">{subject.credits}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                {editingId === subject.id ? (
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            onClick={() => handleSaveEdit(subject.id)}
                                                                            disabled={saving}
                                                                            className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-40"
                                                                        >
                                                                            <CheckIcon className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingId(null)}
                                                                            className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                                                                        >
                                                                            <XIcon className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                ) : isPending ? (
                                                                    <button
                                                                        onClick={() => handleDelete(subject.id)}
                                                                        className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600"
                                                                    >
                                                                        Confirmar
                                                                    </button>
                                                                ) : (
                                                                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                        <button
                                                                            onClick={() => { setEditingId(subject.id); setEditForm({ name: subject.name, semester: subject.semester, credits: subject.credits }); setPendingDelete(null); }}
                                                                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                                        >
                                                                            <PencilIcon className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(subject.id)}
                                                                            className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                                                                        >
                                                                            <Trash2Icon className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
