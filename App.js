import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [ipInput, setIpInput] = useState('http://54.235.3.130:8080');
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permiso Requerido', 'Se requiere acceso a la cámara para tomar fotografías de las placas.');
      return;
    }

    let res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!res.canceled) {
      const selectedUri = res.assets[0].uri;
      setImage(selectedUri);
      setProcessedImage(null);
      setDetectionResult(null);
      uploadImageBinary(selectedUri);
    }
  };

  const uploadImageBinary = async (uri) => {
    let cleanIp = ipInput.trim();

    if (!cleanIp.startsWith('http://') && !cleanIp.startsWith('https://')) {
      cleanIp = `http://${cleanIp}`;
    }
    if (cleanIp.endsWith('/')) {
      cleanIp = cleanIp.slice(0, -1);
    }

    const endpoint = `${cleanIp}/predict/`;
    setLoading(true);

    try {
      const responseFile = await fetch(uri);
      const blob = await responseFile.blob();

      let formData = new FormData();
      formData.append('file', blob, 'photo.jpg');

      let response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      let data = await response.json();

      if (data.image) {
        setProcessedImage(`data:image/jpeg;base64,${data.image}`);
      }

      setDetectionResult({
        success: data.success,
        placas: data.placas || [],
        num_placas: data.num_placas || 0,
        message: data.message || 'OK',
      });

    } catch (error) {
      Alert.alert('Error de Servidor', error.message);
      setDetectionResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Encabezado Principal */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Detección de Placas</Text>
          <Text style={styles.subtitle}>Modelo YOLOv8 desplegado en AWS EC2</Text>
        </View>

        {/* Tarjeta de Configuración de Servidor */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>🌐 Endpoint Servidor AWS:</Text>
          <TextInput 
            style={styles.input} 
            value={ipInput} 
            onChangeText={setIpInput} 
            placeholder="http://IP_EC2:8080"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        {/* Botón de Captura */}
        <TouchableOpacity 
          style={[styles.actionButton, loading && styles.buttonDisabled]} 
          onPress={pickImage} 
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            {loading ? "Procesando Imagen..." : "Escanear Placa con Cámara"}
          </Text>
        </TouchableOpacity>

        {/* Indicador de Carga */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Ejecutando inferencia YOLO en la EC2...</Text>
          </View>
        )}

        {/* Previsualización de Imágenes */}
        {processedImage ? (
          <View style={styles.imageCard}>
            <View style={styles.imageHeader}>
              <Text style={styles.imageTitle}> Resultado del Modelo (YOLOv8)</Text>
            </View>
            <Image source={{ uri: processedImage }} style={styles.previewImage} resizeMode="contain" />
          </View>
        ) : image && !loading ? (
          <View style={styles.imageCard}>
            <View style={styles.imageHeader}>
              <Text style={styles.imageTitle}> Imagen Capturada</Text>
            </View>
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
          </View>
        ) : null}

        {/* Tarjeta de Resultados */}
        {detectionResult && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsHeader}>📊 Resultados del Análisis</Text>
            
            {detectionResult.error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{detectionResult.error}</Text>
              </View>
            ) : (
              <View>
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeLabel}>Placas Detectadas:</Text>
                    <Text style={styles.badgeValue}>{detectionResult.num_placas}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.badgeLabel, { color: '#15803d' }]}>Estado:</Text>
                    <Text style={[styles.badgeValue, { color: '#15803d' }]}>Éxito (200 OK)</Text>
                  </View>
                </View>

                <Text style={styles.placasListTitle}>Lectura de Matrículas:</Text>
                {detectionResult.placas.length > 0 ? (
                  detectionResult.placas.map((placa, idx) => (
                    <View key={idx} style={styles.placaItem}>
                      <Text style={styles.placaText}>🚗 {placa}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noPlacaText}>No se identificaron caracteres de placa en la foto.</Text>
                )}
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  container: { padding: 20, paddingBottom: 40 },
  headerContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  appBadge: { backgroundColor: '#e0e7ff', color: '#4338ca', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '700', overflow: 'hidden', marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#f8fafc', color: '#0f172a' },
  actionButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  buttonDisabled: { backgroundColor: '#94a3b8' },
  actionButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  loadingBox: { alignItems: 'center', marginTop: 20, padding: 15 },
  loadingText: { marginTop: 10, color: '#475569', fontSize: 14, fontWeight: '500' },
  imageCard: { backgroundColor: '#ffffff', borderRadius: 14, marginTop: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  imageHeader: { backgroundColor: '#f8fafc', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  imageTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  previewImage: { width: '100%', height: 260, backgroundColor: '#000' },
  resultsCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 18, marginTop: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  resultsHeader: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  badge: { backgroundColor: '#eff6ff', padding: 10, borderRadius: 10, flex: 0.48, alignItems: 'center' },
  badgeLabel: { fontSize: 11, color: '#1d4ed8', fontWeight: '600' },
  badgeValue: { fontSize: 15, fontWeight: '800', color: '#1e40af', marginTop: 2 },
  placasListTitle: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  placaItem: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#cbd5e1' },
  placaText: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: 1.5, textAlign: 'center' },
  noPlacaText: { color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
  errorBox: { backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
});