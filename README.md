# Detector de Placas Vehiculares (YOLOv8 + FastAPI + React Native)

Aplicación full-stack diseñada para la detección y lectura en tiempo real de placas vehiculares mediante visión artificial. El sistema consta de una aplicación móvil en React Native (Expo) que captura imágenes y se comunica con un backend de alto rendimiento alojado en una instancia de AWS EC2, el cual ejecuta un modelo YOLOv8 personalizado junto con EasyOCR.

---

## Tecnologías Utilizadas

* **Frontend:** React Native, Expo, Expo Go, JavaScript / JSX.
* **Backend:** Python, FastAPI, Uvicorn.
* **Visión Artificial / OCR:** Ultralytics YOLOv8 (`best.pt`), EasyOCR, OpenCV, NumPy.
* **Infraestructura:** AWS EC2 (Ubuntu).

---

## Estructura del Proyecto

AppPlacas/
├── backend/                  
│   ├── app.py
│   └── best.pt               
├── appPlacas/                
│   ├── App.js
│   ├── app.json
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
├── .gitignore               
├── AGENTS.md
├── CLAUDE.md
├── LICENSE
└── README.md
