import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { GROUND_HALF_SIZE } from "../constants/playerConstants";

const { x, y, z } = GROUND_HALF_SIZE;

const Ground = () => {

    return (
        <RigidBody
            type="fixed"
            colliders={false}
            position={[0, -y, 0]}
        >
            <CuboidCollider args={[x, y, z]} />
            <mesh>
                <boxGeometry args={[x * 2, y * 2, z * 2]} />
                <meshStandardMaterial color="green" />
            </mesh>
        </RigidBody>
    );
};

export default Ground;
