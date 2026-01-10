import { Canvas, Fill, Shader, Skia } from "@shopify/react-native-skia";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

export interface FluidOrbProps {
  size?: number;
  speed?: number;
  style?: ViewStyle;
}

const FluidOrb: React.FC<FluidOrbProps> = ({
  size = 320,
  speed = 0.5, // Slower speed looks more premium
  style,
}) => {
  const timeRef = useRef(0);
  const [, forceRender] = useState(0);

  useEffect(() => {
    let mounted = true;
    let last = performance.now();
    const loop = (now: number) => {
      if (!mounted) return;
      const delta = (now - last) / 1000;
      last = now;
      timeRef.current += delta * speed;
      forceRender((v) => v + 1);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { mounted = false; };
  }, [speed]);

  const source = useMemo(() => {
    return Skia.RuntimeEffect.Make(`
uniform float uTime;
uniform float2 uResolution;

// --- 3D ROTATION MATRIX ---
mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

// --- 3D NOISE FUNCTIONS ---
// (We need 3D noise so the texture continues seamlessly around the sphere)
float hash(float3 p) {
    p  = fract( p*0.3183099 + .1 );
    p *= 17.0;
    return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
}

float noise(float3 x) {
    float3 i = floor(x);
    float3 f = fract(x);
    f = f*f*(3.0-2.0*f); // Smoothstep interpolation
    
    return mix(mix(mix( hash(i+float3(0,0,0)), 
                        hash(i+float3(1,0,0)),f.x),
                   mix( hash(i+float3(0,1,0)), 
                        hash(i+float3(1,1,0)),f.x),f.y),
               mix(mix( hash(i+float3(0,0,1)), 
                        hash(i+float3(1,0,1)),f.x),
                   mix( hash(i+float3(0,1,1)), 
                        hash(i+float3(1,1,1)),f.x),f.y),f.z);
}

// Fractal Brownian Motion (Cloudy texture)
float fbm(float3 p) {
    float v = 0.0;
    float a = 0.5;
    float3 shift = float3(100.0);
    // Only 3 octaves needed for this soft look (saves performance)
    for (int i=0; i<3; i++) { 
        v += a * noise(p);
        p = p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

half4 main(float2 fragCoord) {
    // 1. Center coordinates
    float2 uv = (fragCoord - uResolution.xy * 0.5) / min(uResolution.x, uResolution.y);
    
    // 2. Define Sphere Geometry
    float r = length(uv);
    float radius = 0.45; // Leave room for padding
    if (r > radius) return half4(0.0); // Transparent background

    // Calculate Z (depth) to create 3D sphere shape
    float z = sqrt(radius*radius - r*r);
    float3 p = float3(uv, z) / radius; // Normalized normal
    
    // 3. Movement & Texture
    float3 q = p; 
    
    // ROTATION: Spin the sphere on Y axis
    float t = uTime * 0.8;
    q.xz = rot(t) * q.xz;
    q.yz = rot(0.3) * q.yz; // Slight tilt
    
    // DOMAIN WARPING (The "Jade" Pattern)
    // We warp the coordinate 'q' to create swirls
    float3 warp = float3(
        fbm(q * 3.0 + float3(0.0, t*0.1, 0.0)),
        fbm(q * 3.0 + float3(5.2, 1.3, t*0.2)),
        fbm(q * 3.0 + float3(1.9, 8.2, 0.0))
    );
    
    // Sample the noise with the warp
    float n = fbm(q * 4.0 + warp * 1.2);
    
    // 4. Color Palette (Matching your video)
    // Deep Green Shadow
    float3 colDeep = float3(0.25, 0.65, 0.50);   
    // Minty Midtone
    float3 colMid  = float3(0.50, 0.90, 0.70); 
    // Milky White Highlight
    float3 colPale = float3(0.90, 0.98, 0.95); 
    
    // Mix colors based on noise 'n'
    float3 color = mix(colDeep, colMid, smoothstep(0.2, 0.6, n));
    color = mix(color, colPale, smoothstep(0.6, 1.0, n));
    
    // 5. Lighting (The "Shiny" effect)
    float3 normal = p;
    float3 lightPos = normalize(float3(-0.5, -0.8, 1.0)); // Top-Left Light
    float3 viewDir = float3(0.0, 0.0, 1.0);
    
    // Diffuse Shading
    float diff = max(dot(normal, lightPos), 0.0);
    color *= (0.6 + 0.4 * diff); // Keep it bright
    
    // Specular Highlight (The sharp white dot)
    float3 reflectDir = reflect(-lightPos, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 60.0); // 60.0 = Very shiny
    color += float3(1.0) * spec * 0.9;
    
    // Fresnel Rim (Glowing edges)
    float fres = pow(1.0 - dot(viewDir, normal), 3.0);
    color += float3(0.6, 0.9, 0.8) * fres * 0.4;

    return half4(color, 1.0);
}
    `);
  }, []);

  if (!source) return null;

  return (
    <View style={[styles.container, style]}>
      {/* Container adds the drop shadow to match video depth */}
      <View style={styles.shadowContainer}>
        <Canvas style={{ width: size, height: size }}>
          <Fill>
            <Shader
              source={source}
              uniforms={{
                uTime: timeRef.current,
                uResolution: [size, size],
              }}
            />
          </Fill>
        </Canvas>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    // Ensure background matches your app (video has white/transparent)
  },
  shadowContainer: {
    // React Native shadow to mimic the soft floor shadow in the video
    shadowColor: "#2a7a55",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  }
});

export default FluidOrb;