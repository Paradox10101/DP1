function findNextLocation(ubicacionInicial, ubicacionFinal){
    const [latOrigen, lonOrigen] = ubicacionInicial;
    const [latDestino, lonDestino] = ubicacionFinal;

    // Calcular la distancia total en kilómetros entre origen y destino
    const distancia = Math.sqrt(
        Math.pow((latDestino - latOrigen) * 111, 2) + // 1 grado de latitud ≈ 111 km
        Math.pow((lonDestino - lonOrigen) * 111 * Math.cos(latOrigen * (Math.PI / 180)), 2) // 1 grado de longitud ajustado
    );

    // Si la distancia es menor a un umbral, significa que hemos llegado al destino
    const umbral = 0.001;
    if (distancia <= umbral) { // Aproximadamente 1 metro
        return ubicacionInicial
    }

    // Calcular el paso en cada dirección
    const paso = 1000 / 111; // Aproximadamente 1 km en grados
    const direccionLat = (latDestino - latOrigen) / distancia; // Normalizar la dirección
    const direccionLon = (lonDestino - lonOrigen) / distancia;

    return [
        ubicacionInicial[0] + direccionLat * paso,
        ubicacionInicial[1] + direccionLon * paso,
    ];
}

module.exports = {
    findNextLocation
}

