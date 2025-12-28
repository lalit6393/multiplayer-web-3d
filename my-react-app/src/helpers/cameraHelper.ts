import * as THREE from "three";

/**
 * This function returns the camera rotaion around y-axis
 * @param camera 
 * @returns 
 */
export const getCameraYaw = (camera: THREE.Camera) => {
    const euler = new THREE.Euler().setFromQuaternion(
        camera.quaternion,
        "YXZ"
    );
    return euler.y;
}
