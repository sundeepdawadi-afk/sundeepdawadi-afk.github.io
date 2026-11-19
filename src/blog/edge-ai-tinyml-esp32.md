---
title: "Deploying Edge AI on ESP32: Quantization, Memory Constraints, and Sensor Telemetry"
description: "Engineering lessons from the Krishi Chasma project: running 8-bit quantized vision and environmental anomaly detection on 512KB SRAM."
pubDate: "2024-11-20"
author: "Sundeep Dawadi"
tags: ["TinyML", "ESP32", "Edge AI", "IoT", "Krishi Chasma"]
readTime: "8 min read"
featured: true
---

## Bridging Silicon Limits and Agricultural Realities

In rural agricultural heartlands across Nepal, continuous cloud connectivity is a luxury that cannot be assumed. When designing **Krishi Chasma**—an autonomous edge telemetry and crop disease diagnostic system—our central architectural axiom was: *The inference must happen at the field edge.*

However, deploying computer vision and time-series anomaly detection on low-cost microcontrollers like the **ESP32-S3** (dual-core Xtensa LX7, 512 KB internal SRAM, 8 MB external PSRAM) requires ruthless optimization across every byte of memory.

### 1. The Post-Training Quantization (PTQ) Pipeline

Running full-precision FP32 weights on an MCU is mathematically impossible given SRAM limits. We adopted symmetric integer quantization (INT8) using TensorFlow Lite for Microcontrollers (TFLM).

```python
import tensorflow as tf

def representative_data_gen():
    for input_value in dataset.take(100):
        yield [input_value]

converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_dir)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_data_gen
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8

quantized_tflite_model = converter.convert()
```

By constraining activations and weights to signed 8-bit integers, we achieved:
- **$4\times$ footprint reduction**: Model binary size dropped from 14.8 MB to 3.4 MB.
- **Cache alignment**: Zero dynamic heap allocations during runtime inference; all tensor arenas are statically allocated in C++ at boot time.

### 2. Zero-Allocation C++ Tensor Arena

On microcontrollers, dynamic heap allocation (`malloc` or `new`) during an active loop creates catastrophic heap fragmentation. In Krishi Chasma's firmware, we declare a contiguous static buffer:

```cpp
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/schema/schema_generated.h"

constexpr int kTensorArenaSize = 250 * 1024; // 250 KB static SRAM arena
alignas(16) static uint8_t tensor_arena[kTensorArenaSize];

void setup_inference() {
    static tflite::MicroMutableOpResolver<5> resolver;
    resolver.AddConv2D();
    resolver.AddDepthwiseConv2D();
    resolver.AddFullyConnected();
    resolver.AddSoftmax();
    resolver.AddReshape();

    static tflite::MicroInterpreter interpreter(
        model, resolver, tensor_arena, kTensorArenaSize);
    
    TfLiteStatus allocate_status = interpreter.AllocateTensors();
    if (allocate_status != kTfLiteOk) {
        Serial.println("Tensor allocation failed!");
        return;
    }
}
```

### 3. Edge-to-Cloud Telemetry Fusion

When an anomaly is flagged by the on-device INT8 vision classifier (e.g., fungal blight on tea or rice foliage):
1. The ESP32 captures environmental telemetry (soil pH, moisture, ambient temperature).
2. The packet is framed into a compact binary LoRa/MQTT payload (<128 bytes).
3. If an edge cellular gateway is reached, the payload is parsed and converted into local Devanagari SMS and automated voice dispatches for local farmers.

This resilient, zero-allocation architecture earned **1st Place at the Kathmandu University Project Showcase** and continues to drive our hardware-software explorations at the AISSR Lab.
