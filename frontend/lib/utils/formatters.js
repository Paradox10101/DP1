export const formatTime = (isoString) => {
    if (isoString === 'N/A') return 'N/A'
    return new Date(isoString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }