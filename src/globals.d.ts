declare module "*.png" {
    const value: string;
    export = value;
}

declare module "react-teirouter" {
    import { ComponentType, ReactNode } from "react";
    export const TEIRender: ComponentType<{ data: Element; children?: ReactNode }>;
    export const TEIRoute: ComponentType<{ el: string; component: unknown }>;
    export const TEINode: ComponentType<{ [key: string]: unknown }>;
    export const TEINodes: ComponentType<{ teiNodes: NodeListOf<ChildNode>; [key: string]: unknown }>;
}

interface Window {
    highlightRefs: (refs: string[]) => () => void;
    scoreSettings: {
        modernClefs: boolean;
        rightHand: boolean;
        emptyStaves: number;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verovio: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blobStream: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PDFDocument: any;
}

declare module "w3c-xmlserializer" {
    function serialize(node: Node): string;
    export default serialize;
}
