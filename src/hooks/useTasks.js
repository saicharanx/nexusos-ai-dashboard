import { useState, useEffect, useRef } from 'react'
import { STORAGE_KEY } from '../config'
import { hm24 } from '../utils/time'
import { playAlarm } from '../services/alarm'

export function useTasks() {
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })
  const [alarm, setAlarm] = useState(null)

  const tasksRef   = useRef(tasks)
  const alarmFired = useRef(new Set())
  const lsTimer    = useRef(null)

  // Keep ref in sync + debounced localStorage write
  useEffect(() => {
    tasksRef.current = tasks
    clearTimeout(lsTimer.current)
    lsTimer.current = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)), 500)
    return () => clearTimeout(lsTimer.current)
  }, [tasks])

  // Clock + alarm check every second
  useEffect(() => {
    const id = setInterval(() => {
      const cur = hm24(new Date())
      for (const t of tasksRef.current) {
        if (!t.done && t.remind_at === cur && !alarmFired.current.has(t.id + '_' + cur)) {
          alarmFired.current.add(t.id + '_' + cur)
          setAlarm(t)
          playAlarm()
          break
        }
      }
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const addTask = (task) => setTasks((p) => [...p, task])
  const deleteTask = (id) => setTasks((p) => p.filter((t) => t.id !== id))
  const clearAlarm = () => setAlarm(null)

  const snoozeAlarm = (mins) => {
    if (!alarm) return
    const d = new Date(); d.setMinutes(d.getMinutes() + mins)
    const newTime = hm24(d)
    alarmFired.current.delete(alarm.id + '_' + alarm.remind_at)
    setTasks((p) => p.map((t) => (t.id === alarm.id ? { ...t, remind_at: newTime } : t)))
    setAlarm(null)
  }

  const finishAlarm = () => {
    if (!alarm) return
    alarmFired.current.delete(alarm.id + '_' + alarm.remind_at)
    deleteTask(alarm.id)
    setAlarm(null)
  }

  return { tasks, setTasks, addTask, deleteTask, alarm, clearAlarm, snoozeAlarm, finishAlarm, alarmFired }
}
