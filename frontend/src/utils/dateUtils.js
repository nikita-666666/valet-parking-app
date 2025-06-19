/**
 * Форматирует дату и время для отображения в московском часовом поясе
 * @param {string} dateString - строка с датой в формате ISO
 * @returns {string} отформатированная дата и время
 */
export const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow'
    });
};

/**
 * Форматирует дату и время для логов (с днем недели)
 * @param {string} dateString - строка с датой в формате ISO
 * @returns {string} отформатированная дата и время для логов
 */
export const formatLogDateTime = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow'
    });
};

/**
 * Форматирует только время
 * @param {string} dateString - строка с датой в формате ISO
 * @returns {string} отформатированное время
 */
export const formatTime = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow'
    });
};

/**
 * Получает московское время прямо сейчас
 * @returns {string} текущее время в московском часовом поясе
 */
export const getMoscowTime = () => {
    return new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow'
    });
}; 

/**
 * Вычисляет длительность между двумя датами
 * @param {string} startDate - дата начала в формате ISO
 * @param {string} endDate - дата окончания в формате ISO (необязательно, по умолчанию текущее время)
 * @returns {string} отформатированная длительность
 */
export const calculateDuration = (startDate, endDate = null) => {
    if (!startDate) return '-';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffMs = end - start;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
        return `${diffDays}д ${diffHours % 24}ч ${diffMinutes % 60}м`;
    } else if (diffHours > 0) {
        return `${diffHours}ч ${diffMinutes % 60}м`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes}м`;
    } else {
        return 'менее минуты';
    }
};

/**
 * Вычисляет длительность в часах для биллинга
 * @param {string} startDate - дата начала в формате ISO
 * @param {string} endDate - дата окончания в формате ISO (необязательно, по умолчанию текущее время)
 * @returns {number} длительность в часах
 */
export const calculateDurationInHours = (startDate, endDate = null) => {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffMs = end - start;
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Округляем до 2 знаков после запятой
}; 