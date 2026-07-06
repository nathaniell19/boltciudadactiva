import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, Eye, Users, Clock, Calendar, MapPin, Briefcase,
  DollarSign, Pause, Play, Trash2, Edit3, FileText,
} from 'lucide-react-native';
import { useTheme } from '@/contexts';
import { Card, Badge } from '@/components/ui';
import { Spacing } from '@/constants';
import { supabase } from '@/lib/supabase';

export default function VacancyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchJob();
    return () => { mountedRef.current = false; };
  }, [id]);

  const fetchJob = async () => {
    if (!id) return;
    try {
      const [{ data: jobData, error: jobErr }, { data: appData }] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', id).single(),
        supabase.from('applications').select('id, status').eq('job_id', id),
      ]);
      if (!mountedRef.current) return;
      if (!jobErr && jobData) setJob(jobData);
      if (appData) setApplications(appData);
    } catch (err) {
      console.error('Error fetching vacancy:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJob();
    if (mountedRef.current) setRefreshing(false);
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id);
      if (!error && mountedRef.current) {
        setJob((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar vacante',
      '¿Estás seguro de que deseas eliminar esta vacante? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('jobs').delete().eq('id', id);
              if (!error) router.back();
            } catch (err) {
              console.error('Error deleting job:', err);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.colors.success[500];
      case 'paused': return theme.colors.warning[500];
      case 'closed': return theme.colors.error[500];
      default: return theme.colors.neutral[500];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'paused': return 'Pausada';
      case 'closed': return 'Cerrada';
      case 'expired': return 'Expirada';
      default: return status;
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.centerContent}>
          <Text style={{ color: theme.colors.text }}>Cargando...</Text>
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.centerContent}>
          <FileText size={48} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Vacante no encontrada</Text>
        </View>
      </View>
    );
  }

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          Detalle de Vacante
        </Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Trash2 size={20} color={theme.colors.error[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Title + Status */}
        <View style={styles.titleRow}>
          <Text style={[styles.jobTitle, { color: theme.colors.text }]}>{job.title}</Text>
          <Badge
            text={getStatusLabel(job.status)}
            variant={job.status === 'active' ? 'success' : job.status === 'paused' ? 'warning' : 'neutral'}
            size="sm"
          />
        </View>

        <Text style={[styles.publishedDate, { color: theme.colors.textSecondary }]}>
          Publicada el {formatDate(job.created_at)}
        </Text>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Eye size={20} color={theme.colors.primary[500]} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{job.views || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Vistas</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Users size={20} color={theme.colors.info[500]} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{applications.length}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Postulantes</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Briefcase size={20} color={theme.colors.success[500]} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{acceptedCount}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Aceptados</Text>
            </View>
          </View>
        </Card>

        {/* Details */}
        <Card style={styles.detailCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Información del puesto</Text>

          {job.modality && (
            <View style={styles.detailRow}>
              <Briefcase size={16} color={theme.colors.primary[500]} />
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Modalidad:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>{job.modality}</Text>
            </View>
          )}
          {job.contract_type && (
            <View style={styles.detailRow}>
              <FileText size={16} color={theme.colors.primary[500]} />
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Contrato:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>{job.contract_type}</Text>
            </View>
          )}
          {(job.salary_min || job.salary_max) && (
            <View style={styles.detailRow}>
              <DollarSign size={16} color={theme.colors.primary[500]} />
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Salario:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {job.salary_min ? `S/ ${job.salary_min}` : ''}
                {job.salary_min && job.salary_max ? ' - ' : ''}
                {job.salary_max ? `S/ ${job.salary_max}` : ''}
              </Text>
            </View>
          )}
          {job.district && (
            <View style={styles.detailRow}>
              <MapPin size={16} color={theme.colors.primary[500]} />
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Ubicación:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {[job.district, job.province].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
          {job.deadline && (
            <View style={styles.detailRow}>
              <Clock size={16} color={theme.colors.warning[500]} />
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Vence:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatDate(job.deadline)}</Text>
            </View>
          )}
        </Card>

        {/* Description */}
        {job.description && (
          <Card style={styles.detailCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Descripción</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{job.description}</Text>
          </Card>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <Card style={styles.detailCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Requisitos</Text>
            <View style={styles.tagList}>
              {job.requirements.map((req: string, idx: number) => (
                <Badge key={idx} text={req} variant="neutral" size="sm" />
              ))}
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          {job.status === 'active' ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.warning[50], borderColor: theme.colors.warning[300] }]}
              onPress={() => updateStatus('paused')}
            >
              <Pause size={18} color={theme.colors.warning[600]} />
              <Text style={[styles.actionBtnText, { color: theme.colors.warning[600] }]}>Pausar vacante</Text>
            </TouchableOpacity>
          ) : job.status === 'paused' ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.success[50], borderColor: theme.colors.success[300] }]}
              onPress={() => updateStatus('active')}
            >
              <Play size={18} color={theme.colors.success[600]} />
              <Text style={[styles.actionBtnText, { color: theme.colors.success[600] }]}>Activar vacante</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.error[50], borderColor: theme.colors.error[300] }]}
            onPress={handleDelete}
          >
            <Trash2 size={18} color={theme.colors.error[500]} />
            <Text style={[styles.actionBtnText, { color: theme.colors.error[500] }]}>Eliminar vacante</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: { padding: Spacing.sm },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', marginLeft: Spacing.sm },
  deleteBtn: { padding: Spacing.sm },
  scroll: { padding: Spacing.screenPadding, paddingBottom: Spacing['3xl'] },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.xs },
  jobTitle: { flex: 1, fontSize: 20, fontWeight: '700', lineHeight: 26 },
  publishedDate: { fontSize: 12, marginBottom: Spacing.lg },
  statsCard: { marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  detailCard: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: Spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  detailLabel: { fontSize: 13, width: 70 },
  detailValue: { fontSize: 13, flex: 1, fontWeight: '500' },
  description: { fontSize: 14, lineHeight: 22 },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionsRow: { gap: Spacing.md },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 15, fontWeight: '600' },
});
