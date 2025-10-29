import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaThLarge, FaList, FaCheckCircle } from "react-icons/fa";

type Importance = "malo" | "normalne" | "wazne"; // 'pilne' znormalizujemy do 'wazne'
type Difficulty = "latwe" | "normalne" | "trudne";
type TaskStatus = "open" | "done"; // usuwamy 'cancelled' z UI
type Category =
  | "Brak"
  | "Porządki"
  | "Zakupy"
  | "Sprzęt"
  | "Wydarzenia"
  | "Rezerwacje"
  | "Inne";

type Subpoint = {
  id: string;
  text: string;
  done?: boolean;
};

type Point = {
  id: string;
  text: string;
  done?: boolean;
  subpoints: Subpoint[];
};

type Task = {
  id: string;
  title: string;
  importance: Importance;
  difficulty: Difficulty;
  category?: Category;
  // deadline: either specific date or computed from daysToComplete
  dueDate?: string; // ISO yyyy-MM-dd
  daysToComplete?: number;
  points: Point[];
  infoCost?: string;
  infoPurchases?: string;
  infoOther?: string;
  assignees: string[]; // empty => dla wszystkich
  status: TaskStatus;
  createdAt: number;
};

const TEAM: string[] = ["Patryk", "Kuba", "Szymon", "Artur"];

const importanceColor: Record<Importance, string> = {
  malo: "bg-green-600",
  normalne: "bg-orange-500",
  wazne: "bg-red-600",
};

const difficultyColor: Record<Difficulty, string> = {
  latwe: "bg-emerald-700",
  normalne: "bg-blue-500",
  trudne: "bg-pink-700",
};

const newId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

const AdminTodo: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"tiles" | "list">("list");
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<
    | "importance_desc"
    | "importance_asc"
    | "progress_asc"
    | "progress_desc"
    | "timeleft_asc"
    | "timeleft_desc"
    | "difficulty_desc"
    | "difficulty_asc"
    | "title_asc"
    | "title_desc"
  >("importance_desc");
  const [filterMode, setFilterMode] = useState<"all" | "unassigned" | "person">(
    "all"
  );
  const [filterPerson, setFilterPerson] = useState<string>(TEAM[0]);
  const [filterCategory, setFilterCategory] = useState<"all" | Category>("all");

  // Refs for autofocus when adding points/subpoints
  const pointRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const subpointRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [focusPointId, setFocusPointId] = useState<string | null>(null);
  const [focusSubpointId, setFocusSubpointId] = useState<{
    pid: string;
    sid: string;
  } | null>(null);

  // Form state (used for add and edit)
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Brak");
  const [importance, setImportance] = useState<Importance>("normalne");
  const [difficulty, setDifficulty] = useState<Difficulty>("normalne");
  const [dueDate, setDueDate] = useState<string>("");
  const [daysToComplete, setDaysToComplete] = useState<number | "">("");
  const [points, setPoints] = useState<Point[]>([]);
  const [infoCost, setInfoCost] = useState("");
  const [infoPurchases, setInfoPurchases] = useState("");
  const [infoOther, setInfoOther] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [showExtras, setShowExtras] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  // persistence
  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_todo_tasks");
      if (raw) {
        const parsed: Task[] = JSON.parse(raw);
        // normalizacja: "pilne" -> "wazne"
        const normalized = parsed.map((t) => ({
          ...t,
          importance:
            (t.importance as any) === "pilne" ? "wazne" : t.importance,
          // normalizacja kategorii do kanonicznego "Brak"
          category: ((t as any).category === "BRAK" ? "Brak" : (t as any).category) as any,
        }));
        setTasks(normalized);
      }
    } catch {}
    // po jednorazowym odczycie oznacz jako zhydrated
    setHydrated(true);
  }, []);
  useEffect(() => {
    try {
      // Nie zapisuj zanim skończymy inicjalny odczyt, aby nie nadpisać danych pustą listą
      if (!hydrated) return;
      // Zapisujemy z ujednoliconą kategorią ("Brak")
      const toSave = tasks.map((t) => ({
        ...t,
        category: ((t as any).category === "BRAK" ? "Brak" : (t as any).category) as any,
      }));
      localStorage.setItem("admin_todo_tasks", JSON.stringify(toSave));
    } catch {}
  }, [tasks, hydrated]);

  const computedDueDate = useMemo(() => {
    if (daysToComplete && typeof daysToComplete === "number") {
      const base = new Date();
      base.setDate(base.getDate() + daysToComplete);
      const y = base.getFullYear();
      const m = String(base.getMonth() + 1).padStart(2, "0");
      const d = String(base.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return "";
  }, [daysToComplete]);

  // Form helpers
  const resetForm = () => {
    setTitle("");
  setCategory("Brak");
    setImportance("normalne");
    setDifficulty("normalne");
    setDueDate("");
    setDaysToComplete("");
    setPoints([]);
    setInfoCost("");
    setInfoPurchases("");
    setInfoOther("");
    setAssignees([]);
    setShowExtras(false);
  };

  const startEdit = (t: Task) => {
    // Toggle edit mode: if clicking the same task, exit edit
    if (editingTaskId === t.id) {
      cancelEdit();
      return;
    }
    setEditingTaskId(t.id);
    setSelectedTaskId(null);
    setTitle(t.title);
    setImportance(t.importance);
  setDifficulty(t.difficulty);
  setCategory(((t as any).category === "BRAK" ? "Brak" : (t as any).category) ?? "Brak");
    setDueDate(t.dueDate || "");
    setDaysToComplete(t.daysToComplete ?? "");
    setPoints(t.points.map((p) => ({ ...p, subpoints: [...p.subpoints] })));
    setInfoCost(t.infoCost || "");
    setInfoPurchases(t.infoPurchases || "");
    setInfoOther(t.infoOther || "");
    setAssignees(t.assignees);
    setShowExtras(!!(t.infoCost || t.infoPurchases || t.infoOther));
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    resetForm();
  };

  const addTask = () => {
    const fallbackTitle = `Zadanie #${tasks.length + 1}`;
    const finalTitle = title.trim() || fallbackTitle;
    const task: Task = {
      id: newId(),
      title: finalTitle,
      importance,
      difficulty,
      category,
      dueDate: dueDate || computedDueDate || undefined,
      daysToComplete:
        typeof daysToComplete === "number" ? daysToComplete : undefined,
      points: points.map((p) => ({
        ...p,
        subpoints: p.subpoints.map((s) => ({ ...s })),
      })),
      infoCost: infoCost || undefined,
      infoPurchases: infoPurchases || undefined,
      infoOther: infoOther || undefined,
      assignees: [...assignees],
      status: "open",
      createdAt: Date.now(),
    };
    setTasks((prev) => [task, ...prev]);
    // Jeśli aktywne filtry ukryłyby nowe zadanie – zresetuj je, aby użytkownik od razu je zobaczył
    const wouldHideByPerson =
      (filterMode === "person" && !assignees.includes(filterPerson)) ||
      (filterMode === "unassigned" && assignees.length > 0);
    const wouldHideByCategory =
      filterCategory !== "all" && filterCategory !== category;
    if (wouldHideByPerson || wouldHideByCategory) {
      setFilterMode("all");
      setFilterPerson(TEAM[0]);
      setFilterCategory("all");
    }
    resetForm();
  };

  const saveTask = () => {
    if (!editingTaskId) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingTaskId
          ? {
              ...t,
              title: title.trim(),
              importance,
              difficulty,
              category,
              dueDate: dueDate || computedDueDate || undefined,
              daysToComplete:
                typeof daysToComplete === "number" ? daysToComplete : undefined,
              points: points.map((p) => ({
                ...p,
                subpoints: p.subpoints.map((s) => ({ ...s })),
              })),
              infoCost: infoCost || undefined,
              infoPurchases: infoPurchases || undefined,
              infoOther: infoOther || undefined,
              assignees: [...assignees],
            }
          : t
      )
    );
    setEditingTaskId(null);
    resetForm();
  };

  // Deprecated by toggleTaskStatus
  // const markDone = (id: string) => {
  //     setTasks(prev => prev.map(t => (t.id === id ? { ...t, status: "done" } : t)));
  // };
  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setShowDeleteId(null);
  };

  // Points/subpoints handling
  const addPoint = () => {
    const id = newId();
    setPoints((prev) => [...prev, { id, text: "", subpoints: [] }]);
    setFocusPointId(id);
  };
  const updatePointText = (pid: string, text: string) => {
    setPoints((prev) => prev.map((p) => (p.id === pid ? { ...p, text } : p)));
  };
  const removePoint = (pid: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== pid));
  };
  const addSubpoint = (pid: string) => {
    const sid = newId();
    setPoints((prev) =>
      prev.map((p) =>
        p.id === pid
          ? { ...p, subpoints: [...p.subpoints, { id: sid, text: "" }] }
          : p
      )
    );
    setFocusSubpointId({ pid, sid });
  };

  // Focus effects after adding new inputs
  useEffect(() => {
    if (focusPointId) {
      // wait next paint to ensure element is rendered
      const t = setTimeout(() => {
        pointRefs.current[focusPointId!]?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [focusPointId, points]);
  useEffect(() => {
    if (focusSubpointId) {
      const t = setTimeout(() => {
        subpointRefs.current[focusSubpointId.sid]?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [focusSubpointId, points]);

  // Compute weighted progress for a task (points equally weighted; subpoints split the parent share)
  const computeProgress = (task: Task): number => {
    const nTop = task.points.length;
    const base = nTop > 0 ? 100 / nTop : 0;
    let progressAcc = 0;
    task.points.forEach((p) => {
      if (p.subpoints.length > 0) {
        const m = p.subpoints.length;
        const per = base / m;
        p.subpoints.forEach((s) => {
          if (s.done) progressAcc += per;
        });
      } else {
        if (p.done) progressAcc += base;
      }
    });
    return Math.round(progressAcc);
  };

  // Toggle task status (done/open)
  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "open" : "done" }
          : t
      )
    );
  };

  // Border color helper based on deadline and states
  const getTaskBorderClass = (task: Task): string => {
    // Editing state overrides
    if (editingTaskId === task.id)
      return "border-2 border-[#00d9ff] animate-pulse";
    // Done
    if (task.status === "done") return "border-2 border-emerald-600";
    // Deadline-based coloring (only for open tasks)
    if (task.dueDate) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.floor(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays < 0) return "border-2 border-pink-500"; // po terminie
        if (diffDays === 0) return "border-2 border-red-600"; // ten dzień
        if (diffDays === 1) return "border-2 border-orange-500"; // 1 dzień przed
        if (diffDays === 2) return "border-2 border-yellow-400"; // 2 dni przed
      } catch {}
    }
    // Default: keep border width to avoid layout shift; same color as card background
    return "border-2 border-[#1e2636]";
  };
  const updateSubpointText = (pid: string, sid: string, text: string) => {
    setPoints((prev) =>
      prev.map((p) =>
        p.id === pid
          ? {
              ...p,
              subpoints: p.subpoints.map((s) =>
                s.id === sid ? { ...s, text } : s
              ),
            }
          : p
      )
    );
  };
  const removeSubpoint = (pid: string, sid: string) => {
    setPoints((prev) =>
      prev.map((p) =>
        p.id === pid
          ? { ...p, subpoints: p.subpoints.filter((s) => s.id !== sid) }
          : p
      )
    );
  };

  const importanceRank: Record<Importance, number> = {
    malo: 0,
    normalne: 1,
    wazne: 2,
  };
  const difficultyRank: Record<Difficulty, number> = {
    latwe: 0,
    normalne: 1,
    trudne: 2,
  };

  const timeLeftMinutes = (t: Task): number | null => {
    if (!t.dueDate) return null;
    const now = new Date();
    const due = new Date(t.dueDate);
    // compare with end of due date day
    due.setHours(23, 59, 59, 999);
    const diffMs = due.getTime() - now.getTime();
    return Math.round(diffMs / 60000);
  };

  const baseTasks = showCompleted
    ? tasks
    : tasks.filter((t) => t.status !== "done");
  const filteredTasks = baseTasks.filter((t) => {
    let pass = true;
    if (filterMode === "all") pass = true;
    else if (filterMode === "unassigned") pass = (t.assignees?.length || 0) === 0;
    else if (filterMode === "person") pass = t.assignees?.includes(filterPerson) ?? false;

    if (pass && filterCategory !== "all") {
      let tc: string = (t as any).category ?? "Brak";
      if (tc === "BRAK") tc = "Brak"; // kompatybilność ze starszą wartością
      pass = tc === filterCategory;
    }
    return pass;
  });
  const visibleTasks = [...filteredTasks].sort((a, b) => {
    switch (sortOption) {
      case "importance_desc":
        return importanceRank[b.importance] - importanceRank[a.importance];
      case "importance_asc":
        return importanceRank[a.importance] - importanceRank[b.importance];
      case "progress_asc": {
        const pa = computeProgress(a);
        const pb = computeProgress(b);
        return pa - pb;
      }
      case "progress_desc": {
        const pa = computeProgress(a);
        const pb = computeProgress(b);
        return pb - pa;
      }
      case "timeleft_asc": {
        const ta = timeLeftMinutes(a);
        const tb = timeLeftMinutes(b);
        if (ta == null && tb == null) return 0;
        if (ta == null) return 1; // missing move last
        if (tb == null) return -1;
        return ta - tb;
      }
      case "timeleft_desc": {
        const ta = timeLeftMinutes(a);
        const tb = timeLeftMinutes(b);
        if (ta == null && tb == null) return 0;
        if (ta == null) return 1; // keep missing last
        if (tb == null) return -1;
        return tb - ta;
      }
      case "difficulty_desc":
        return difficultyRank[b.difficulty] - difficultyRank[a.difficulty];
      case "difficulty_asc":
        return difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
      case "title_asc":
        return a.title.localeCompare(b.title, "pl", { sensitivity: "base" });
      case "title_desc":
        return b.title.localeCompare(a.title, "pl", { sensitivity: "base" });
      default:
        return 0;
    }
  });

  // Counters for header (respecting showCompleted toggle via baseTasks)
  const generalCount = useMemo(
    () => baseTasks.filter((t) => (t.assignees?.length || 0) === 0).length,
    [baseTasks]
  );
  const perPersonCounts = useMemo(
    () =>
      TEAM.map((p) => {
        const assigned = baseTasks.filter((t) =>
          t.assignees?.includes(p)
        ).length;
        const total = assigned + generalCount; // ogólne doliczane do każdego
        return { person: p, assigned, general: generalCount, total };
      }),
    [baseTasks, generalCount]
  );

  // Toggle done on points/subpoints in selected task
  const togglePointDone = (taskId: string, pid: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          points: t.points.map((p) => {
            if (p.id !== pid) return p;
            const hasSubs = p.subpoints && p.subpoints.length > 0;
            const allSubsDone = hasSubs
              ? p.subpoints.every((s) => s.done)
              : true;
            // Nie pozwalaj zaznaczyć głównego, jeśli są podpunkty i nie wszystkie są zrobione
            if (hasSubs && !allSubsDone && !p.done) return p;
            return { ...p, done: !p.done };
          }),
        };
      })
    );
  };
  const toggleSubpointDone = (taskId: string, pid: string, sid: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          points: t.points.map((p) => {
            if (p.id !== pid) return p;
            const newSubs = p.subpoints.map((s) =>
              s.id === sid ? { ...s, done: !s.done } : s
            );
            const allSubsDone = newSubs.every((s) => s.done);
            // Autozaznacz główny, jeśli wszystkie podpunkty zaznaczone; inaczej odznacz
            return { ...p, subpoints: newSubs, done: allSubsDone };
          }),
        };
      })
    );
  };

  const canMarkTaskDone = (task: Task) => {
    // Można oznaczyć jako zrobione tylko gdy wszystkie punkty bez podpunktów są zrobione
    // oraz wszystkie podpunkty są zrobione
    for (const p of task.points) {
      if (p.subpoints.length > 0) {
        if (!p.subpoints.every((s) => s.done)) return false;
      } else {
        if (!p.done) return false;
      }
    }
    return true;
  };

  const rightPanelContent = () => {
    if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId);
      if (!task) return null;
      const progress = computeProgress(task);
      return (
        <div className="bg-[#1e2636] p-6 rounded-lg shadow-md">
          <button
            onClick={() => setSelectedTaskId(null)}
            className="mb-4 text-sm px-3 py-2 rounded bg-gray-600 hover:bg-gray-500"
          >
            ← Powrót do listy
          </button>
          <div className="flex items-start justify-between">
            <h3 className="text-2xl font-bold text-[#00d9ff]">{task.title}</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-300">Status:</span>
              <span
                className={`px-2 py-0.5 rounded ${
                  task.status === "done" ? "bg-emerald-600" : "bg-red-600/40"
                }`}
              >
                {task.status === "done" ? "Zrobione" : "Niezrobione"}
              </span>
              <span className="text-gray-300 ml-3">Ważność:</span>
              <span
                className={`px-2 py-0.5 rounded ${
                  importanceColor[task.importance]
                }`}
              >
                {task.importance === "malo"
                  ? "Mało ważne"
                  : task.importance === "normalne"
                  ? "Normalne"
                  : "Ważne"}
              </span>
              <span className="text-gray-300 ml-2">Trudność:</span>
              <span
                className={`px-2 py-0.5 rounded ${
                  difficultyColor[task.difficulty]
                }`}
              >
                {task.difficulty === "latwe"
                  ? "Łatwe"
                  : task.difficulty === "normalne"
                  ? "Normalne"
                  : "Trudne"}
              </span>
            </div>
          </div>

          <div className="text-gray-300 mt-2">
            <div>
              Dodano:{" "}
              <span className="font-medium text-white">
                {new Date(task.createdAt).toISOString().slice(0, 10)}
              </span>
            </div>
            {task.dueDate ? (
              <div>
                Termin:{" "}
                <span className="font-medium text-white">{task.dueDate}</span>
              </div>
            ) : (
              <div>
                Termin: <span className="text-gray-400">brak</span>
              </div>
            )}
            <div>
              Przypisane:{" "}
              {task.assignees.length
                ? task.assignees.join(", ")
                : "dla wszystkich"}
            </div>
            <div>
              Kategoria: {" "}
              <span className="font-medium text-white">
                {((task as any).category === "BRAK" ? "Brak" : (task as any).category) ?? "Brak"}
              </span>
            </div>
          </div>

          {/* Pasek postępu (stały gradient, maska odsłaniająca procent) */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300">Postęp</span>
              <span className="text-sm text-gray-300">{progress}%</span>
            </div>
            <div className="relative h-3 bg-gray-700 rounded overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
              <div
                className="absolute top-0 right-0 h-full bg-gray-700"
                style={{ width: `${100 - progress}%` }}
              />
            </div>
          </div>

          {task.points.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Treść zadania
              </h4>
              <div className="space-y-3">
                {task.points.map((p, idx) => (
                  <div key={p.id} className="border-b border-gray-700 pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-5 text-right">
                          {idx + 1}.
                        </span>
                        <span
                          className={
                            p.done ? "line-through text-gray-400" : undefined
                          }
                        >
                          {p.text}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!p.done}
                        onChange={() => togglePointDone(task.id, p.id)}
                        className="w-4 h-4"
                        disabled={
                          p.subpoints.length > 0 &&
                          !p.subpoints.every((s) => s.done)
                        }
                        title={
                          p.subpoints.length > 0 &&
                          !p.subpoints.every((s) => s.done)
                            ? "Zaznacz najpierw wszystkie podpunkty"
                            : ""
                        }
                      />
                    </div>
                    {p.subpoints.length > 0 && (
                      <div className="pl-6 mt-2 space-y-1">
                        {p.subpoints.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">-</span>
                              <span
                                className={
                                  s.done
                                    ? "line-through text-gray-400"
                                    : undefined
                                }
                              >
                                {s.text}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={!!s.done}
                              onChange={() =>
                                toggleSubpointDone(task.id, p.id, s.id)
                              }
                              className="w-4 h-4"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(task.infoCost || task.infoPurchases || task.infoOther) && (
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {task.infoCost && (
                <div className="bg-[#0f1525] p-4 rounded">
                  <div className="text-sm text-gray-400">Koszt</div>
                  <div className="text-white">{task.infoCost}</div>
                </div>
              )}
              {task.infoPurchases && (
                <div className="bg-[#0f1525] p-4 rounded">
                  <div className="text-sm text-gray-400">Zakupy</div>
                  <div className="text-white whitespace-pre-wrap">
                    {task.infoPurchases}
                  </div>
                </div>
              )}
              {task.infoOther && (
                <div className="bg-[#0f1525] p-4 rounded">
                  <div className="text-sm text-gray-400">Inne</div>
                  <div className="text-white whitespace-pre-wrap">
                    {task.infoOther}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => startEdit(task)}
              className="px-4 py-2 rounded bg-[#00d9ff] text-[#0f1525] hover:bg-[#00b8e6]"
            >
              Edytuj
            </button>
            <button
              onClick={() => setShowDeleteId(task.id)}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-500"
            >
              Usuń
            </button>
            <button
              onClick={() => toggleTaskStatus(task.id)}
              disabled={task.status !== "done" ? !canMarkTaskDone(task) : false}
              className={`ml-auto w-60 text-center px-4 py-2 rounded ${
                task.status === "done"
                  ? "bg-gray-600 hover:bg-gray-500"
                  : canMarkTaskDone(task)
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-emerald-600/40 cursor-not-allowed"
              }`}
            >
              {task.status === "done"
                ? "Oznacz jako niezrobione"
                : "Oznacz jako zrobione"}
            </button>
          </div>
        </div>
      );
    }

    // general view
    if (viewMode === "list") {
      return (
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-[#1e2636] p-4 rounded-lg shadow-md flex items-center gap-4 ${getTaskBorderClass(
                task
              )}`}
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => setSelectedTaskId(task.id)}
              >
                <div className="flex items-center gap-3">
                  <h4 className="text-base font-semibold text-white">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-gray-300">Ważność:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        importanceColor[task.importance]
                      }`}
                    >
                      {task.importance === "malo"
                        ? "Mało ważne"
                        : task.importance === "normalne"
                        ? "Normalne"
                        : "Ważne"}
                    </span>
                    <span className="text-gray-300 ml-2">Trudność:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        difficultyColor[task.difficulty]
                      }`}
                    >
                      {task.difficulty === "latwe"
                        ? "Łatwe"
                        : task.difficulty === "normalne"
                        ? "Normalne"
                        : "Trudne"}
                    </span>
                  </div>
                </div>
                {/* Mini pasek postępu pod tytułem */}
                <div className="mt-1">
                  {(() => {
                    const p = computeProgress(task);
                    return (
                      <div className="relative h-2 bg-gray-700 rounded overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                        <div
                          className="absolute top-0 right-0 h-full bg-[#1e2636]"
                          style={{ width: `${100 - p}%` }}
                        />
                      </div>
                    );
                  })()}
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Termin:{" "}
                  {task.dueDate ? (
                    <span className="text-white">{task.dueDate}</span>
                  ) : (
                    <span className="text-gray-400">brak</span>
                  )}{" "}
                  • Przypisane:{" "}
                  {task.assignees.length
                    ? task.assignees.join(", ")
                    : "dla wszystkich"}{" "}
                  • Kategoria:{" "}
                  <span className="text-white">
                    {((task as any).category === "BRAK" ? "Brak" : (task as any).category) ?? "Brak"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(task)}
                  className="px-3 py-1.5 text-xs rounded bg-[#00d9ff] text-[#0f1525] hover:bg-[#00b8e6]"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => setShowDeleteId(task.id)}
                  className="px-3 py-1.5 text-xs rounded bg-red-800 hover:bg-red-500"
                >
                  Usuń
                </button>
                <button
                  onClick={() => toggleTaskStatus(task.id)}
                  disabled={
                    task.status !== "done" ? !canMarkTaskDone(task) : false
                  }
                  className={`w-40 text-center px-2 py-1.5 text-xs rounded ${
                    task.status === "done"
                      ? "bg-gray-600 hover:bg-gray-500"
                      : canMarkTaskDone(task)
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-emerald-600/40 cursor-not-allowed"
                  }`}
                >
                  {task.status === "done"
                    ? "Oznacz jako niezrobione"
                    : "Oznacz jako zrobione"}
                </button>
              </div>
            </div>
          ))}
          {visibleTasks.length === 0 && (
            <div className="text-gray-400">
              Brak zadań. Dodaj pierwsze zadanie w panelu po lewej.
            </div>
          )}
        </div>
      );
    }
    // tiles
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleTasks.map((task) => (
          <div
            key={task.id}
            className={`relative bg-[#1e2636] p-5 pb-12 min-h-[170px] rounded-lg shadow-md ${getTaskBorderClass(
              task
            )}`}
          >
            <div
              className="cursor-pointer"
              onClick={() => setSelectedTaskId(task.id)}
            >
              <h4 className="text-lg font-bold text-white break-words">
                {task.title}
              </h4>
              {/* Mini pasek postępu pod tytułem */}
              <div className="mt-1">
                {(() => {
                  const p = computeProgress(task);
                  return (
                    <div className="relative h-2 bg-gray-700 rounded overflow-hidden w-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                      <div
                        className="absolute top-0 right-0 h-full bg-[#1e2636]"
                        style={{ width: `${100 - p}%` }}
                      />
                    </div>
                  );
                })()}
              </div>
              {/* Sekcja informacji: lewo Termin/Przypisane, prawo Ważność/Trudność (wyrównane wierszami) */}
              <div className="mt-2 grid grid-cols-2 gap-4 items-start">
                <div>
                  <div className="text-sm text-gray-300 mt-1">
                    Termin:{" "}
                    {task.dueDate ? (
                      <span className="text-white">{task.dueDate}</span>
                    ) : (
                      <span className="text-gray-400">brak</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    Przypisane:{" "}
                    {task.assignees.length
                      ? task.assignees.join(", ")
                      : "dla wszystkich"}
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    Kategoria:{" "}
                    <span className="text-white">
                      {((task as any).category === "BRAK" ? "Brak" : (task as any).category) ?? "Brak"}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] flex flex-col items-end gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">W:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        importanceColor[task.importance]
                      }`}
                    >
                      {task.importance === "malo"
                        ? "Mało ważne"
                        : task.importance === "normalne"
                        ? "Normalne"
                        : "Ważne"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">T:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        difficultyColor[task.difficulty]
                      }`}
                    >
                      {task.difficulty === "latwe"
                        ? "Łatwe"
                        : task.difficulty === "normalne"
                        ? "Normalne"
                        : "Trudne"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                onClick={() => startEdit(task)}
                className="px-3 py-1.5 text-xs rounded bg-[#00d9ff] text-[#0f1525] hover:bg-[#00b8e6]"
              >
                Edytuj
              </button>
              <button
                onClick={() => setShowDeleteId(task.id)}
                className="px-3 py-1.5 text-xs rounded bg-red-600 hover:bg-red-500"
              >
                Usuń
              </button>
              <button
                onClick={() => toggleTaskStatus(task.id)}
                disabled={
                  task.status !== "done" ? !canMarkTaskDone(task) : false
                }
                className={`w-24 text-center px-3 py-1.5 text-xs rounded ${
                  task.status === "done"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : canMarkTaskDone(task)
                    ? "bg-gray-600 hover:bg-gray-500"
                    : "bg-gray-600/40 cursor-not-allowed"
                }`}
              >
                {task.status === "done" ? "Zrobione" : "Niezrobione"}
              </button>
            </div>
          </div>
        ))}
        {visibleTasks.length === 0 && (
          <div className="text-gray-400">
            Brak zadań. Dodaj pierwsze zadanie w panelu po lewej.
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="bg-[#0f1525] text-white px-6 py-10 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Panel 1/3: Dodawanie/Edytowanie */}
        <div className="w-full md:w-1/3 bg-[#1e2636] p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-2xl font-bold mb-6 text-[#00d9ff]">
            {editingTaskId ? "Edytuj zadanie" : "Dodaj zadanie"}
          </h2>

          <div className="mb-4">
            <div className="flex gap-3">
              <div className="max-w-3/5 flex-1">
                <label className="block text-sm mb-1">Nazwa zadania</label>
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 min-w-0 p-2 bg-[#0f1525] border border-gray-600 rounded-lg text-white focus:border-[#00d9ff] focus:ring-1 focus:ring-[#00d9ff]"
                    placeholder="Wpisz tytuł"
                  />
                </div>
              </div>
              <div className="max-w-2/5 flex-1">
                <label className="block text-sm mb-1">Kategoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full p-2 bg-[#0f1525] border border-gray-600 rounded-lg text-white focus:ring-1 focus:ring-[#00d9ff]"
                >
                  <option>Brak</option>
                  <option>Porządki</option>
                  <option>Zakupy</option>
                  <option>Sprzęt</option>
                  <option>Wydarzenia</option>
                  <option>Rezerwacje</option>
                  <option>Inne</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Ważność</label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value as Importance)}
                className="w-full p-2 bg-[#0f1525] border border-gray-600 rounded-lg text-white focus:ring-1 focus:ring-[#00d9ff]"
              >
                <option value="malo">Mało ważne</option>
                <option value="normalne">Normalne</option>
                <option value="wazne">Ważne</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Trudność</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full p-2 bg-[#0f1525] border border-gray-600 rounded-lg text-white focus:ring-1 focus:ring-[#00d9ff]"
              >
                <option value="latwe">Łatwe</option>
                <option value="normalne">Normalne</option>
                <option value="trudne">Trudne</option>
              </select>
            </div>
          </div>

          {/* Deadline section */}
          <div className="mb-4 p-4 bg-[#0f1525] rounded-lg">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300 w-24">Data (do)</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1 p-2 text-sm bg-[#1e2636] border border-gray-600 rounded text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300 w-24">Dni (do)</span>
                <input
                  type="number"
                  min={1}
                  value={daysToComplete === "" ? "" : String(daysToComplete)}
                  onChange={(e) =>
                    setDaysToComplete(
                      e.target.value === ""
                        ? ""
                        : Math.max(1, parseInt(e.target.value))
                    )
                  }
                  className="w-28 p-2 text-sm bg-[#1e2636] border border-gray-600 rounded text-white"
                />
                {computedDueDate && (
                  <span className="text-xs text-gray-300">
                    → do: <span className="text-white">{computedDueDate}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Użyta zostanie data jeśli ustawiona, w przeciwnym razie termin
                liczony z ilości dni.
              </p>
            </div>
          </div>

          {/* Points builder */}
          <div className="mb-4 p-4 bg-[#0f1525] rounded-lg">
            <div className="flex items-center justify-start mb-3">
              <button
                onClick={addPoint}
                className="text-xs px-2 py-1 rounded bg-gray-600 hover:bg-gray-500"
              >
                Dodaj punkt
              </button>
            </div>
            {points.length === 0 && (
              <div className="text-xs text-gray-400">
                Brak punktów. Dodaj pierwszy punkt.
              </div>
            )}
            <div className="space-y-4">
              {points.map((p) => (
                <div key={p.id} className="border border-gray-700 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={p.text}
                      onChange={(e) => updatePointText(p.id, e.target.value)}
                      placeholder="Treść punktu"
                      className="flex-1 p-2 bg-[#1e2636] border border-gray-600 rounded text-white"
                      ref={(el) => {
                        pointRefs.current[p.id] = el;
                        if (!el && focusPointId === p.id) setFocusPointId(null);
                      }}
                    />
                    <button
                      onClick={() => removePoint(p.id)}
                      className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500"
                    >
                      Usuń
                    </button>
                  </div>
                  <div className="pl-4">
                    {p.subpoints.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={s.text}
                          onChange={(e) =>
                            updateSubpointText(p.id, s.id, e.target.value)
                          }
                          placeholder="Treść podpunktu"
                          className="flex-1 p-2 bg-[#1e2636] border border-gray-600 rounded text-white"
                          ref={(el) => {
                            subpointRefs.current[s.id] = el;
                            if (!el && focusSubpointId?.sid === s.id)
                              setFocusSubpointId(null);
                          }}
                        />
                        <button
                          onClick={() => removeSubpoint(p.id, s.id)}
                          className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500"
                        >
                          Usuń
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addSubpoint(p.id)}
                      className="mt-2 text-xs px-2 py-1 rounded bg-gray-600 hover:bg-gray-500"
                    >
                      Dodaj podpunkt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          

          {/* Assignees */}
          <div className="mb-3 p-4 bg-[#0f1525] rounded-lg">
            <div className="flex flex-wrap gap-3">
              {TEAM.map((person) => (
                <label key={person} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={assignees.includes(person)}
                    onChange={(e) =>
                      setAssignees((prev) =>
                        e.target.checked
                          ? [...prev, person]
                          : prev.filter((p) => p !== person)
                      )
                    }
                    className="w-4 h-4 text-[#00d9ff] bg-[#1e2636] border-gray-600 rounded focus:ring-[#00d9ff]"
                  />
                  {person}
                </label>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Nie zaznaczysz nikogo → zadanie dla wszystkich.
            </div>
          </div>

          {/* Toggle additional info */}
          <div className="mb-4 ml-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showExtras}
                onChange={(e) => setShowExtras(e.target.checked)}
                className="w-4 h-4 text-[#00d9ff] bg-[#1e2636] border-gray-600 rounded focus:ring-[#00d9ff]"
              />
              Inne
            </label>
          </div>
          {/* Additional info */}
          {showExtras && (
            <div className="mb-4 grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm mb-1">Koszt</label>
                <input
                  type="text"
                  value={infoCost}
                  onChange={(e) => setInfoCost(e.target.value)}
                  placeholder="np. 500 PLN"
                  className="w-full p-2 bg-[#0f1525] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Zakupy</label>
                <textarea
                  value={infoPurchases}
                  onChange={(e) => setInfoPurchases(e.target.value)}
                  placeholder="Lista zakupów"
                  rows={1}
                  className="w-full p-2 bg-[#0f1525] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm mb-1">Inne</label>
                <textarea
                  value={infoOther}
                  onChange={(e) => setInfoOther(e.target.value)}
                  placeholder="Dodatkowe informacje"
                  rows={2}
                  className="w-full p-2 bg-[#0f1525] border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>
          )}

          {editingTaskId ? (
            <div className="flex gap-3">
              <button
                onClick={saveTask}
                className="flex-1 bg-[#00d9ff] text-[#0f1525] py-3 px-4 rounded-lg font-medium hover:bg-[#00b8e6]"
              >
                Zapisz
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 bg-gray-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-500"
              >
                Anuluj
              </button>
            </div>
          ) : (
            <button
              onClick={addTask}
              className="w-full bg-[#00d9ff] text-[#0f1525] py-3 px-4 rounded-lg font-medium hover:bg-[#00b8e6]"
            >
              Dodaj zadanie
            </button>
          )}
        </div>

        {/* Right panel 2/3: list or details */}
        <div className="w-full md:w-2/3">
          {/* Nagłówek z tytułem i ikonkami na tym samym poziomie */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-bold text-[#00d9ff]">Lista zadań</h3>
              {/* Cały zestaw liczników na środku */}
              <div className="flex-1 flex items-center justify-center gap-1 flex-wrap">
                <span
                  className="inline-block px-2 py-0.5 rounded border border-gray-700 bg-[#1b2231] text-gray-200 text-sm"
                  title="Łączna liczba zadań"
                >
                  {tasks.length} zadań
                </span>
                <span className="hidden sm:inline text-gray-600">|</span>

                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {perPersonCounts.map((pc) => (
                    <span
                      key={pc.person}
                      className="px-2 py-0.5 rounded bg-[#1e2636] border border-gray-700 text-gray-300 text-sm"
                      title={`${pc.person}: ${pc.total} (w tym ogólne: ${pc.general})`}
                    >
                      {pc.person}:{" "}
                      <span className="text-white font-semibold">
                        {pc.total}
                      </span>{" "}
                      (<span className="text-gray-300">{pc.general}</span>)
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Pokaż ukończone */}
                <button
                  className={`w-8 h-8 rounded flex items-center justify-center transition ${
                    showCompleted
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-[#1e2636] text-gray-500 hover:bg-[#0f1525]"
                  }`}
                  title="Pokaż ukończone"
                  onClick={() => setShowCompleted((v) => !v)}
                >
                  <FaCheckCircle size={16} />
                </button>
                {/* Kafelki */}
                <button
                  className={`w-8 h-8 rounded flex items-center justify-center transition ${
                    viewMode === "tiles"
                      ? "bg-[#0f1525] text-gray-300 shadow"
                      : "bg-[#1e2636] text-gray-500 hover:bg-[#0f1525]"
                  }`}
                  title="Kafelki"
                  onClick={() => setViewMode("tiles")}
                >
                  <FaThLarge size={16} />
                </button>
                {/* Lista */}
                <button
                  className={`w-8 h-8 rounded flex items-center justify-center transition ${
                    viewMode === "list"
                      ? "bg-[#0f1525] text-gray-300 shadow"
                      : "bg-[#1e2636] text-gray-500 hover:bg-[#0f1525]"
                  }`}
                  title="Lista"
                  onClick={() => setViewMode("list")}
                >
                  <FaList size={16} />
                </button>
              </div>
            </div>
            {/* Drugi rząd: sortowanie/filtry + reset */}
            <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
              {/* Sortowanie i filtry */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-300">Sortuj:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="p-1.5 bg-[#1e2636] border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="importance_desc">Od najważniejszych</option>
                    <option value="importance_asc">Od najmniej ważnych</option>
                    <option value="progress_asc">Postęp rosnąco</option>
                    <option value="progress_desc">Postęp malejąco</option>
                    <option value="timeleft_asc">Czas do końca rosnąco</option>
                    <option value="timeleft_desc">
                      Czas do końca malejąco
                    </option>
                    <option value="difficulty_desc">Od najtrudniejszych</option>
                    <option value="difficulty_asc">Od najłatwiejszych</option>
                    <option value="title_asc">Alfab. rosnąco</option>
                    <option value="title_desc">Alfab. malejąco</option>
                  </select>
                  <button
                    type="button"
                    title="Reset sortowania"
                    className="px-2 py-1 text-xs rounded border border-gray-600 text-gray-200 hover:bg-[#232b3b]"
                    onClick={() => setSortOption("importance_desc")}
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-300">Filtr:</span>
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value as any)}
                    className="p-1.5 bg-[#1e2636] border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="all">Wszystkie</option>
                    <option value="unassigned">Dla wszystkich</option>
                    <option value="person">Osoba…</option>
                  </select>
                  {filterMode === "person" && (
                    <select
                      value={filterPerson}
                      onChange={(e) => setFilterPerson(e.target.value)}
                      className="p-1.5 bg-[#1e2636] border border-gray-600 rounded text-white text-sm"
                    >
                      {TEAM.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  )}
                  {/* Kategoria */}
                  <span className="text-gray-300">Kateg:</span>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="p-1.5 bg-[#1e2636] border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="all">Wszystkie</option>
                    <option value="Brak">Brak</option>
                    <option value="Porządki">Porządki</option>
                    <option value="Zakupy">Zakupy</option>
                    <option value="Sprzęt">Sprzęt</option>
                    <option value="Wydarzenia">Wydarzenia</option>
                    <option value="Rezerwacje">Rezerwacje</option>
                    <option value="Inne">Inne</option>
                  </select>
                  <button
                    type="button"
                    title="Reset filtrów"
                    className="px-2 py-1 text-xs rounded border border-gray-600 text-gray-200 hover:bg-[#232b3b]"
                    onClick={() => {
                      setFilterMode("all");
                      setFilterPerson(TEAM[0]);
                      setFilterCategory("all");
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
          {rightPanelContent()}
        </div>

        {/* Delete modal */}
        {showDeleteId && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowDeleteId(null)}
          >
            <div
              className="bg-[#1e2636] p-6 rounded-lg w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-semibold text-white mb-2">
                Usunąć zadanie?
              </h4>
              <p className="text-gray-300 mb-6">
                Tej operacji nie można cofnąć.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteId(null)}
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => deleteTask(showDeleteId)}
                  className="px-4 py-2 rounded bg-red-800 hover:bg-red-500"
                >
                  Usuń
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminTodo;
