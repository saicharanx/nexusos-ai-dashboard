import { useState, useEffect } from 'react'
import { fetchWeather } from '../services/weather'

const INITIAL = {
    temp: '--', condition: { l: 'Loading…', i: '🌤️' },
    city: 'Locating…', scene: 'clear-afternoon', cond: 'clear', tod: 'afternoon',
}

export function useWeather() {
    const [weather, setWeather] = useState(INITIAL)

    useEffect(() => {
        const load = () =>
            fetchWeather()
                .then(setWeather)
                .catch((err) => {
                    console.warn('[Weather]', err.message)
                    setWeather((prev) => {
                        if (prev.condition?.l === 'Loading…')
                            return { ...prev, condition: { l: 'Weather unavailable', i: '🌤️' } }
                        return prev
                    })
                })

        load()
        const id = setInterval(load, 10 * 60 * 1000)
        return () => clearInterval(id)
    }, [])

    return weather
}
