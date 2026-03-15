import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // ── Trainer ──────────────────────────────────────────────
  const trainerPassword = await bcrypt.hash('trainer123', 10);
  const trainer = await prisma.user.upsert({
    where: { email: 'ana@trainer.com' },
    update: {},
    create: {
      name: 'Ana Paula',
      email: 'ana@trainer.com',
      password: trainerPassword,
      role: 'trainer',
      phone: '(11) 91111-0000',
      status: 'active',
    },
  });
  console.log('Trainer created:', trainer.email);

  // ── Student ────────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'bia@example.com' },
    update: {},
    create: {
      name: 'Beatriz',
      email: 'bia@example.com',
      password: studentPassword,
      role: 'student',
      phone: '(11) 98765-4321',
      birthdate: new Date('1995-07-14'),
      height: 165,
      currentWeight: 65.8,
      targetWeight: 62.0,
      startWeight: 68.5,
      goal: 'Perda de peso e condicionamento',
      startDate: new Date('2026-01-05'),
      plan: 'Plano Premium — 3×/semana',
      status: 'active',
      avatar: 'B',
      trainerId: trainer.id,
    },
  });
  console.log('Student created:', student.email);

  // ── Trainings ──────────────────────────────────────────────
  const t1 = await prisma.training.create({
    data: {
      title: 'Full Body Beginner',
      duration: 30,
      level: 'Beginner',
      category: 'Full Body',
      exercises: {
        create: [
          { name: 'Agachamento', reps: '3x12', rest: '60s' },
          { name: 'Flexão de braço', reps: '3x10', rest: '60s' },
          { name: 'Prancha', reps: '3x30s', rest: '45s' },
          { name: 'Afundo', reps: '3x10 cada', rest: '60s' },
          { name: 'Abdominal', reps: '3x20', rest: '45s' },
        ],
      },
    },
  });

  const t4 = await prisma.training.create({
    data: {
      title: 'Lower Body Power',
      duration: 40,
      level: 'Intermediate',
      category: 'Pernas',
      exercises: {
        create: [
          { name: 'Leg press', reps: '4x12', rest: '75s' },
          { name: 'Cadeira extensora', reps: '3x15', rest: '60s' },
          { name: 'Cadeira flexora', reps: '3x15', rest: '60s' },
          { name: 'Panturrilha em pé', reps: '4x20', rest: '45s' },
          { name: 'Agachamento sumô', reps: '3x12', rest: '60s' },
        ],
      },
    },
  });
  console.log('Trainings created');

  // ── Schedule ───────────────────────────────────────────────
  await prisma.schedule.createMany({
    data: [
      { userId: student.id, trainingId: t1.id, date: new Date('2026-03-15'), time: '07:00', title: 'Full Body Beginner', done: false },
      { userId: student.id, trainingId: t4.id, date: new Date('2026-03-17'), time: '09:00', title: 'Lower Body Power',   done: false },
    ],
  });
  console.log('Schedule created');

  // ── Assessments ───────────────────────────────────────────
  await prisma.assessment.create({
    data: {
      userId: student.id,
      date: new Date('2026-01-05'),
      weight: 68.5,
      fatPercent: 28.4,
      leanMass: 49.0,
      fatMass: 19.5,
      measurements: { waist: 78, hip: 99, chest: 88, rightArm: 29, leftArm: 28, rightThigh: 56, leftThigh: 55, abdomen: 85, calf: 36 },
      skinfolds: { triceps: 22, subscapular: 18, suprailiac: 24, abdominal: 26, thigh: 28 },
      notes: 'Avaliação inicial',
    },
  });
  await prisma.assessment.create({
    data: {
      userId: student.id,
      date: new Date('2026-03-09'),
      weight: 65.8,
      fatPercent: 25.1,
      leanMass: 49.5,
      fatMass: 16.3,
      measurements: { waist: 73, hip: 95, chest: 86, rightArm: 31, leftArm: 30, rightThigh: 53, leftThigh: 52, abdomen: 79, calf: 37 },
      skinfolds: { triceps: 18, subscapular: 14, suprailiac: 19, abdominal: 20, thigh: 22 },
      notes: 'Excelente progresso! Redução de 3,3% de gordura em 2 meses.',
    },
  });
  console.log('Assessments created');

  // ── Anamnesis ──────────────────────────────────────────────
  await prisma.anamnesis.create({
    data: {
      userId: student.id,
      filledAt: new Date('2026-01-05'),
      personalInfo: { bloodType: 'A+', occupation: 'Analista de Marketing', sleepHours: 7, waterIntake: '1,5 L/dia', smokingStatus: 'Não fumante', alcoholUse: 'Raramente (1–2× por mês)' },
      healthHistory: { conditions: ['Hipotireoidismo controlado'], surgeries: ['Apendicectomia (2018)'], allergies: ['Amendoim (leve)'], intolerances: ['Lactose (moderada)'], medications: ['Levotiroxina 50 mcg'], familyHistory: ['Diabetes tipo 2 (mãe)', 'Hipertensão (pai)'] },
      physicalActivity: { currentLevel: 'Sedentária (últimos 6 meses)', pastActivities: ['Pilates (2 anos)', 'Caminhada'], injuries: ['Tendinite no joelho direito (2023, resolvida)'], limitations: 'Leve desconforto no joelho direito em agachamentos profundos' },
      dietaryProfile: { eatingPattern: '3 refeições principais + 1–2 lanches', avoidedFoods: ['Amendoim', 'Leite'], preferredFoods: ['Frango', 'Ovos', 'Frutas'], supplementsInUse: ['Vitamina D3 (2000 UI)', 'Ômega-3'], waterConsumption: 'Irregular, precisa aumentar', mealPrepSkill: 'Cozinha bem' },
      goals: { primary: 'Perda de gordura e melhora do condicionamento', secondary: 'Ganho de massa magra', timeframe: '6 meses', motivation: 'Casamento em outubro de 2026', obstacles: 'Rotina agitada no trabalho' },
      trainerNotes: 'Aluna comprometida. Atenção ao joelho no início.',
      isCurrent: true,
    },
  });
  console.log('Anamnesis created');

  // ── Nutrition Plan ─────────────────────────────────────────
  await prisma.nutritionPlan.create({
    data: {
      userId: student.id,
      title: 'Plano Alimentar — Semana 11',
      updatedBy: 'Ana Paula Souza',
      dailyTargets: { calories: 1800, protein: 130, carbs: 200, fat: 55 },
      isCurrent: true,
      meals: {
        create: [
          {
            name: 'Café da Manhã', time: '07:30', emoji: '☕',
            items: { create: [
              { name: 'Omelete de claras (3 ovos)', calories: 210, protein: 26, carbs: 2, fat: 10 },
              { name: 'Pão integral (2 fatias)', calories: 160, protein: 6, carbs: 30, fat: 2 },
            ]},
          },
          {
            name: 'Almoço', time: '12:30', emoji: '🍽️',
            items: { create: [
              { name: 'Frango grelhado (150 g)', calories: 250, protein: 47, carbs: 0, fat: 5 },
              { name: 'Arroz integral (4 col.)', calories: 210, protein: 4, carbs: 44, fat: 2 },
              { name: 'Salada verde + azeite', calories: 70, protein: 1, carbs: 4, fat: 6 },
            ]},
          },
          {
            name: 'Jantar', time: '19:30', emoji: '🌙',
            items: { create: [
              { name: 'Salmão assado (120 g)', calories: 240, protein: 28, carbs: 0, fat: 14 },
              { name: 'Batata-doce assada (200 g)', calories: 180, protein: 2, carbs: 41, fat: 0 },
            ]},
          },
        ],
      },
    },
  });
  console.log('Nutrition plan created');

  // ── Personal Records ───────────────────────────────────────
  await prisma.personalRecord.createMany({
    data: [
      { userId: student.id, exercise: 'Agachamento Livre',  category: 'Força',  value: '60 kg',      date: new Date('2026-02-20'), improvement: '+10 kg'  },
      { userId: student.id, exercise: 'Prancha Abdominal',  category: 'Core',   value: '2 min 30 s', date: new Date('2026-03-01'), improvement: '+45 s'   },
      { userId: student.id, exercise: 'Flexão de Braço',    category: 'Força',  value: '20 reps',    date: new Date('2026-03-05'), improvement: '+8 reps' },
    ],
  });
  console.log('Personal records created');

  // ── Chat ───────────────────────────────────────────────────
  await prisma.chatMessage.createMany({
    data: [
      { senderId: trainer.id, receiverId: student.id, text: 'Oi Bia! Tudo bem? Vi que você treinou ontem, ótimo! 💪', time: new Date('2026-03-12T09:05:00') },
      { senderId: student.id, receiverId: trainer.id, text: 'Oi Ana! Sim, fiz o Full Body. Minha panturrilha doi muito kkkk', time: new Date('2026-03-12T09:18:00') },
      { senderId: trainer.id, receiverId: student.id, text: 'Isso é DOMS — sinal de que trabalhou bem! Hidrata bastante e faz uma caminhada leve.', time: new Date('2026-03-12T09:25:00') },
    ],
  });
  console.log('Chat messages created');

  console.log('\n✅ Seed concluído!');
  console.log('  Trainer: ana@trainer.com / trainer123');
  console.log('  Aluno:   bia@example.com / student123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
