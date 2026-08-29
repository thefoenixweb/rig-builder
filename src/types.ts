export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface ITransform {
  position: IVector3;
  rotation: IVector3;
  scale: IVector3;
}

export interface IMeshParameters {
  jointRadius: number;
  jointThickness: number;
  armRadius: number;
  color: string;
}

export interface INode {
  id: string;
  name: string;
  parentId: string | null;
  offset: ITransform; // static spatial offset from parent
  rotation: ITransform; // dynamic local joint angles (FK)
  constraint: "spinner" | "bender" | "none";
  min: number;
  max: number;
  meshParameters: IMeshParameters;
}

export interface ITarget {
  id: string;
  position: IVector3;
  rotation: IVector3;
  endEffectorId: string | null; // the specific node this target drives via IK
}

export interface IRigState {
  nodes: Record<string, INode>;
  targets: Record<string, ITarget>;
  followTarget: boolean;
  controlMode: "translate" | "rotate";
  controlSpace: "world" | "local";
  eulerRingsVisible: boolean;
  controlVisible: boolean;
}

