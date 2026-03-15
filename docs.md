# API — Documentação de Rotas

> **Convenção de base:** todas as rotas abaixo são prefixadas por `/api`.  
> Autenticação via `Authorization: Bearer <token>` (JWT) em todas as rotas protegidas.  
> Respostas de erro seguem o padrão `{ "message": "descrição" }`.

---

## Sumário

1. [Autenticação](#1-autenticação)
2. [Usuário (perfil do aluno)](#2-usuário-perfil-do-aluno)
3. [Treinos](#3-treinos)
4. [Nutrição](#4-nutrição)
5. [Agenda](#5-agenda)
6. [Avaliações físicas](#6-avaliações-físicas)
7. [Anamnese](#7-anamnese)
8. [Chat / Mensagens](#8-chat--mensagens)
9. [Progresso](#9-progresso)
10. [Trainer — Alunos](#10-trainer--alunos)

---

## 1. Autenticação

### `POST /api/auth/login`

Autentica um usuário (aluno ou personal).

**Request body**
```json
{
  "email": "ana@trainer.com",
  "password": "senha123"
}
```

**Response `200`**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "trainer1",
    "name": "Ana Paula",
    "role": "trainer"
  }
}
```

**Erros:** `401` credenciais inválidas.

---

### `POST /api/auth/logout`

Invalida a sessão/token atual.

**Response `204`** — sem corpo.

---

### `GET /api/auth/me`

Retorna o usuário autenticado.

**Response `200`**
```json
{
  "id": "u1",
  "name": "Beatriz",
  "role": "student",
  "email": "bia@example.com"
}
```

**Erros:** `401` token ausente ou inválido.

---

## 2. Usuário (perfil do aluno)

### `GET /api/user`

Retorna o perfil completo do aluno autenticado.

**Response `200`**
```json
{
  "id": "u1",
  "name": "Beatriz",
  "role": "student",
  "email": "bia@example.com",
  "phone": "(11) 98765-4321",
  "birthdate": "1995-07-14",
  "height": 165,
  "currentWeight": 65.8,
  "targetWeight": 62.0,
  "startWeight": 68.5,
  "goal": "Perda de peso e condicionamento",
  "startDate": "2026-01-05",
  "trainer": "Ana Paula Souza",
  "plan": "Plano Premium — 3×/semana"
}
```

---

### `PUT /api/user`

Atualiza dados de perfil do aluno autenticado.

**Request body** *(campos opcionais, apenas os que mudam)*
```json
{
  "phone": "(11) 99999-0000",
  "currentWeight": 64.5
}
```

**Response `200`** — objeto atualizado conforme `GET /api/user`.

---

## 3. Treinos

### `GET /api/trainings`

Lista todos os treinos disponíveis.

**Query params**

| Param | Tipo   | Descrição                        |
|-------|--------|----------------------------------|
| `q`   | string | Filtra por título (case-insensitive) |

**Response `200`**
```json
[
  {
    "id": "t1",
    "title": "Full Body Beginner",
    "duration": 30,
    "level": "Beginner",
    "category": "Full Body",
    "exercises": [
      { "id": "e1", "name": "Agachamento", "reps": "3x12", "rest": "60s" }
    ]
  }
]
```

---

### `POST /api/trainings`

Cria um novo treino. **Requer role `trainer`.**

**Request body**
```json
{
  "title": "Core & Mobilidade",
  "duration": 20,
  "level": "Beginner",
  "category": "Funcional",
  "exercises": [
    { "name": "Prancha lateral", "reps": "3x20s cada", "rest": "30s" },
    { "name": "Dead bug",        "reps": "3x10",       "rest": "30s" }
  ]
}
```

**Response `201`** — objeto do treino criado com `id` gerado pelo servidor.

---

### `GET /api/trainings/:id`

Retorna um treino específico.

**Response `200`** — mesmo shape do item em `GET /api/trainings`.  
**Erros:** `404` treino não encontrado.

---

### `PUT /api/trainings/:id`

Atualiza um treino existente. **Requer role `trainer`.**

**Request body** *(campos opcionais, apenas os que mudam)*
```json
{
  "duration": 35,
  "exercises": [
    { "id": "e1", "name": "Agachamento", "reps": "4x12", "rest": "60s" },
    { "name": "Novo exercício",           "reps": "3x10", "rest": "45s" }
  ]
}
```

**Response `200`** — objeto atualizado.  
**Erros:** `404` treino não encontrado.

---

### `DELETE /api/trainings/:id`

Remove um treino. **Requer role `trainer`.**

**Response `204`** — sem corpo.  
**Erros:** `404` treino não encontrado.

---

## 4. Nutrição

### `GET /api/nutrition`

Retorna dados nutricionais do aluno autenticado.

**Query params**

| Param     | Tipo   | Valores          | Descrição                        |
|-----------|--------|------------------|----------------------------------|
| `section` | string | `plan` \| `diary` | Retorna apenas o plano semanal ou apenas o diário. Sem o param retorna o objeto completo. |

**Response `200` — sem `section`**
```json
{
  "plan": { ... },
  "diary": [ ... ]
}
```

**Response `200` — `?section=plan`**
```json
{
  "title": "Plano Alimentar — Semana 11",
  "updatedBy": "Ana Paula Souza",
  "updatedAt": "2026-03-10",
  "dailyTargets": { "calories": 1800, "protein": 130, "carbs": 200, "fat": 55 },
  "meals": [
    {
      "id": "m1",
      "name": "Café da Manhã",
      "time": "07:30",
      "emoji": "☕",
      "items": [
        { "name": "Omelete de claras (3 ovos)", "calories": 210, "protein": 26, "carbs": 2, "fat": 10 }
      ]
    }
  ]
}
```

**Response `200` — `?section=diary`**
```json
[
  {
    "date": "2026-03-13",
    "entries": [
      {
        "id": "d1",
        "mealSlot": "Café da Manhã",
        "description": "Omelete de claras + pão integral",
        "calories": 425,
        "protein": 36,
        "carbs": 39,
        "fat": 13,
        "time": "07:45"
      }
    ]
  }
]
```

---

### `PUT /api/nutrition/plan`

Substitui o plano alimentar de um aluno. **Requer role `trainer`.**

**Query params**

| Param       | Tipo   | Descrição       |
|-------------|--------|-----------------|
| `studentId` | string | ID do aluno     |

**Request body** — mesmo shape de `GET /api/nutrition?section=plan`.

**Response `200`** — plano atualizado.

---

### `POST /api/nutrition/diary`

Adiciona uma entrada no diário alimentar do aluno autenticado.

**Request body**
```json
{
  "date": "2026-03-15",
  "mealSlot": "Almoço",
  "description": "Frango grelhado + salada",
  "calories": 520,
  "protein": 50,
  "carbs": 30,
  "fat": 12,
  "time": "12:45"
}
```

**Response `201`** — entrada criada com `id` gerado.

---

## 5. Agenda

### `GET /api/schedule`

Lista sessões de treino agendadas.

**Query params**

| Param   | Tipo   | Exemplo     | Descrição                    |
|---------|--------|-------------|------------------------------|
| `month` | string | `2026-03`   | Filtra pelo mês (`YYYY-MM`). |

**Response `200`**
```json
[
  {
    "id": "s1",
    "trainingId": "t1",
    "date": "2026-03-13",
    "time": "07:00",
    "title": "Full Body Beginner",
    "done": false
  }
]
```

---

### `POST /api/schedule`

Cria uma nova sessão na agenda. **Requer role `trainer`.**

**Request body**
```json
{
  "studentId": "u1",
  "trainingId": "t1",
  "date": "2026-04-05",
  "time": "08:00",
  "title": "Full Body Beginner"
}
```

**Response `201`** — sessão criada com `id` gerado e `done: false`.

---

### `PATCH /api/schedule/:id`

Atualiza uma sessão (ex.: marcar como feita).

**Request body** *(campos opcionais)*
```json
{
  "done": true,
  "time": "09:00"
}
```

**Response `200`** — sessão atualizada.  
**Erros:** `404` sessão não encontrada.

---

### `DELETE /api/schedule/:id`

Remove uma sessão da agenda.

**Response `204`** — sem corpo.  
**Erros:** `404` sessão não encontrada.

---

## 6. Avaliações físicas

### `GET /api/assessments`

Lista todas as avaliações do aluno autenticado, ordenadas por `date` crescente.

**Response `200`**
```json
[
  {
    "id": "av1",
    "date": "2026-01-05",
    "weight": 68.5,
    "fatPercent": 28.4,
    "leanMass": 49.0,
    "fatMass": 19.5,
    "measurements": {
      "waist": 78, "hip": 99, "chest": 88,
      "rightArm": 29, "leftArm": 28,
      "rightThigh": 56, "leftThigh": 55,
      "abdomen": 85, "calf": 36
    },
    "skinfolds": {
      "triceps": 22, "subscapular": 18,
      "suprailiac": 24, "abdominal": 26, "thigh": 28
    },
    "notes": "Avaliação inicial"
  }
]
```

---

### `POST /api/assessments`

Registra nova avaliação para um aluno. **Requer role `trainer`.**

**Request body**
```json
{
  "studentId": "u1",
  "date": "2026-04-06",
  "weight": 64.5,
  "fatPercent": 24.0,
  "leanMass": 49.8,
  "fatMass": 14.7,
  "measurements": {
    "waist": 71, "hip": 94, "chest": 85,
    "rightArm": 31, "leftArm": 30,
    "rightThigh": 52, "leftThigh": 51,
    "abdomen": 77, "calf": 37
  },
  "skinfolds": {
    "triceps": 16, "subscapular": 13,
    "suprailiac": 17, "abdominal": 18, "thigh": 20
  },
  "notes": "Ótima evolução no 3º mês."
}
```

**Response `201`** — avaliação criada com `id` gerado.

---

### `GET /api/assessments/:id`

Retorna uma avaliação específica.

**Response `200`** — mesmo shape do item em `GET /api/assessments`.  
**Erros:** `404` avaliação não encontrada.

---

### `PUT /api/assessments/:id`

Atualiza dados de uma avaliação. **Requer role `trainer`.**

**Request body** *(campos opcionais)*
```json
{
  "notes": "Revisão: considerar hidratação no dia da avaliação.",
  "fatPercent": 23.8
}
```

**Response `200`** — avaliação atualizada.  
**Erros:** `404` avaliação não encontrada.

---

## 7. Anamnese

### `GET /api/anamnesis`

Retorna a ficha de anamnese do aluno autenticado.

**Response `200`**
```json
{
  "filledAt": "2026-01-05",
  "personalInfo": {
    "bloodType": "A+",
    "occupation": "Analista de Marketing",
    "sleepHours": 7,
    "waterIntake": "1,5 L/dia",
    "smokingStatus": "Não fumante",
    "alcoholUse": "Raramente (1–2× por mês)"
  },
  "healthHistory": {
    "conditions":    ["Hipotireoidismo controlado"],
    "surgeries":     ["Apendicectomia (2018)"],
    "allergies":     ["Amendoim (leve)"],
    "intolerances":  ["Lactose (moderada)"],
    "medications":   ["Levotiroxina 50 mcg"],
    "familyHistory": ["Diabetes tipo 2 (mãe)", "Hipertensão (pai)"]
  },
  "physicalActivity": {
    "currentLevel":   "Sedentária (últimos 6 meses)",
    "pastActivities": ["Pilates (2 anos)", "Caminhada"],
    "injuries":       ["Tendinite no joelho direito (2023, resolvida)"],
    "limitations":    "Leve desconforto no joelho direito em agachamentos profundos"
  },
  "dietaryProfile": {
    "eatingPattern":    "3 refeições principais + 1–2 lanches",
    "avoidedFoods":     ["Amendoim", "Leite"],
    "preferredFoods":   ["Frango", "Ovos", "Frutas"],
    "supplementsInUse": ["Vitamina D3 (2000 UI)", "Ômega-3"],
    "waterConsumption": "Irregular, precisa aumentar",
    "mealPrepSkill":    "Cozinha bem, tem tempo para preparar refeições"
  },
  "goals": {
    "primary":    "Perda de gordura e melhora do condicionamento",
    "secondary":  "Ganho de massa magra e melhora da postura",
    "timeframe":  "6 meses",
    "motivation": "Casamento em outubro de 2026",
    "obstacles":  "Rotina agitada no trabalho, come fora 2–3× por semana"
  },
  "trainerNotes": "Aluna comprometida. Atenção ao joelho no início."
}
```

---

### `PUT /api/anamnesis`

Cria ou substitui a ficha de anamnese. **Requer role `trainer`.**

**Query params**

| Param       | Tipo   | Descrição   |
|-------------|--------|-------------|
| `studentId` | string | ID do aluno |

**Request body** — mesmo shape completo de `GET /api/anamnesis`.

**Response `200`** — ficha atualizada.

---

## 8. Chat / Mensagens

### `GET /api/chat`

Retorna histórico de mensagens entre aluno e personal.

**Query params**

| Param       | Tipo   | Descrição                               |
|-------------|--------|-----------------------------------------|
| `studentId` | string | **Obrigatório para trainers.** ID do aluno. Alunos autenticados não precisam informar — retorna automaticamente o seu chat. |

**Response `200`**
```json
[
  {
    "id": "msg1",
    "from": "trainer",
    "text": "Oi Bia! Tudo bem?",
    "time": "2026-03-12T09:05:00"
  },
  {
    "id": "msg2",
    "from": "student",
    "text": "Oi Ana! Sim, fiz o Full Body.",
    "time": "2026-03-12T09:18:00"
  }
]
```

---

### `POST /api/chat`

Envia uma mensagem.

**Request body**
```json
{
  "studentId": "u1",
  "text": "Pode aumentar a carga na próxima semana?"
}
```

> O campo `from` é inferido pelo role do usuário autenticado: `"trainer"` ou `"student"`.

**Response `201`**
```json
{
  "id": "msg9",
  "from": "student",
  "text": "Pode aumentar a carga na próxima semana?",
  "time": "2026-03-15T10:30:00"
}
```

---

## 9. Progresso

### `GET /api/progress`

Retorna dados de progresso do aluno autenticado.

**Response `200`**
```json
{
  "weightHistory": [
    { "date": "2026-01-05", "value": 68.5 },
    { "date": "2026-03-09", "value": 65.8 }
  ],
  "weeklyWorkouts": [
    { "week": "Sem 1", "count": 2 },
    { "week": "Sem 10", "count": 3 }
  ],
  "personalRecords": [
    {
      "id": "pr1",
      "exercise": "Agachamento Livre",
      "category": "Força",
      "value": "60 kg",
      "date": "2026-02-20",
      "improvement": "+10 kg"
    }
  ],
  "summary": {
    "totalWorkouts": 30,
    "totalHours": 38,
    "weightLost": 2.7,
    "streak": 3
  }
}
```

---

## 10. Trainer — Alunos

### `GET /api/trainer/students`

Lista todos os alunos do personal autenticado. **Requer role `trainer`.**

**Query params**

| Param    | Tipo   | Valores                | Descrição                                  |
|----------|--------|------------------------|--------------------------------------------|
| `status` | string | `active` \| `inactive` | Filtra por status. Sem o param retorna todos. |
| `q`      | string | —                      | Busca por nome (case-insensitive).          |

**Response `200`**
```json
[
  {
    "id": "u1",
    "name": "Beatriz Souza",
    "email": "bia@example.com",
    "phone": "(11) 98765-4321",
    "birthdate": "1995-07-14",
    "height": 165,
    "currentWeight": 65.8,
    "targetWeight": 62.0,
    "startWeight": 68.5,
    "goal": "Perda de peso e condicionamento",
    "startDate": "2026-01-05",
    "plan": "Plano Premium — 3×/semana",
    "status": "active",
    "avatar": "B",
    "lastWorkout": "2026-03-13",
    "nextWorkout": "2026-03-15",
    "weeklyGoal": 3,
    "weeklyDone": 3,
    "streak": 5,
    "totalWorkouts": 30,
    "fatPercent": 25.1,
    "notes": "Atenção ao joelho no início."
  }
]
```

---

### `POST /api/trainer/students`

Cadastra um novo aluno para o personal autenticado. **Requer role `trainer`.**

**Request body**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(11) 91234-5678",
  "birthdate": "1993-04-10",
  "height": 180,
  "startWeight": 90.0,
  "targetWeight": 82.0,
  "goal": "Hipertrofia",
  "plan": "Plano Premium — 4×/semana"
}
```

**Response `201`** — objeto do aluno criado com `id` gerado, `status: "active"`, `startDate: <hoje>`.

---

### `GET /api/trainer/students/:id`

Retorna dados de um aluno específico com dados de seção opcionais. **Requer role `trainer`.**

**Query params**

| Param     | Tipo   | Valores                            | Descrição                                        |
|-----------|--------|------------------------------------|--------------------------------------------------|
| `section` | string | `anamnesis` \| `assessments` \| `progress` | Retorna a seção solicitada em vez do perfil base. |

**Response `200` — sem `section`** — objeto do aluno (mesmo shape de `GET /api/trainer/students`).

**Response `200` — `?section=anamnesis`** — mesmo shape de `GET /api/anamnesis`.

**Response `200` — `?section=assessments`** — mesmo shape de `GET /api/assessments`.

**Response `200` — `?section=progress`** — mesmo shape de `GET /api/progress`.

**Erros:** `404` aluno não encontrado.

---

### `PUT /api/trainer/students/:id`

Atualiza dados cadastrais de um aluno. **Requer role `trainer`.**

**Request body** *(campos opcionais)*
```json
{
  "status": "inactive",
  "plan": "Plano Básico — 2×/semana",
  "notes": "Em pausa por viagem. Retorna em abril."
}
```

**Response `200`** — objeto atualizado.  
**Erros:** `404` aluno não encontrado.

---

### `DELETE /api/trainer/students/:id`

Remove o cadastro de um aluno. **Requer role `trainer`.**

**Response `204`** — sem corpo.  
**Erros:** `404` aluno não encontrado.

---

## Tabela resumo de rotas

| Método   | Rota                                       | Role exigida  | Descrição                            |
|----------|--------------------------------------------|---------------|--------------------------------------|
| `POST`   | `/api/auth/login`                          | pública       | Login                                |
| `POST`   | `/api/auth/logout`                         | autenticado   | Logout                               |
| `GET`    | `/api/auth/me`                             | autenticado   | Usuário atual                        |
| `GET`    | `/api/user`                                | student       | Perfil do aluno                      |
| `PUT`    | `/api/user`                                | student       | Atualizar perfil                     |
| `GET`    | `/api/trainings`                           | student       | Listar treinos                       |
| `POST`   | `/api/trainings`                           | trainer       | Criar treino                         |
| `GET`    | `/api/trainings/:id`                       | student       | Detalhe do treino                    |
| `PUT`    | `/api/trainings/:id`                       | trainer       | Editar treino                        |
| `DELETE` | `/api/trainings/:id`                       | trainer       | Excluir treino                       |
| `GET`    | `/api/nutrition`                           | student       | Plano + diário                       |
| `PUT`    | `/api/nutrition/plan`                      | trainer       | Substituir plano alimentar           |
| `POST`   | `/api/nutrition/diary`                     | student       | Adicionar entrada no diário          |
| `GET`    | `/api/schedule`                            | student       | Listar agenda                        |
| `POST`   | `/api/schedule`                            | trainer       | Criar sessão                         |
| `PATCH`  | `/api/schedule/:id`                        | student/trainer | Atualizar sessão (ex.: marcar feita) |
| `DELETE` | `/api/schedule/:id`                        | trainer       | Remover sessão                       |
| `GET`    | `/api/assessments`                         | student       | Listar avaliações                    |
| `POST`   | `/api/assessments`                         | trainer       | Registrar avaliação                  |
| `GET`    | `/api/assessments/:id`                     | student       | Detalhe da avaliação                 |
| `PUT`    | `/api/assessments/:id`                     | trainer       | Atualizar avaliação                  |
| `GET`    | `/api/anamnesis`                           | student       | Ler anamnese                         |
| `PUT`    | `/api/anamnesis`                           | trainer       | Criar/atualizar anamnese             |
| `GET`    | `/api/chat`                                | student/trainer | Histórico de mensagens             |
| `POST`   | `/api/chat`                                | student/trainer | Enviar mensagem                    |
| `GET`    | `/api/progress`                            | student       | Dados de progresso                   |
| `GET`    | `/api/trainer/students`                    | trainer       | Listar alunos                        |
| `POST`   | `/api/trainer/students`                    | trainer       | Cadastrar aluno                      |
| `GET`    | `/api/trainer/students/:id`                | trainer       | Perfil do aluno + seções             |
| `PUT`    | `/api/trainer/students/:id`                | trainer       | Atualizar aluno                      |
| `DELETE` | `/api/trainer/students/:id`                | trainer       | Excluir aluno                        |
