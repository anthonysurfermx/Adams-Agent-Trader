import Foundation

@main struct TraderLandGeometryContract {
    static func main() {
        let cases: [(CGFloat, CGFloat, Int, Int)] = [(0,0,2,3),(46,23,3,3),(-46,23,2,4),(46,-23,2,2),(-46,-23,1,3),(0,46,3,4),(92,0,3,2)]
        for scale: CGFloat in [0.3, 0.7, 1, 1.5, 2.6] {
            for (dx, dy, col, row) in cases {
                let value = TraderLandGeometry.draggedPosition(col: 2, row: 3, translation: CGSize(width: dx * scale, height: dy * scale), scale: scale)
                precondition(value.col == col && value.row == row, "Drag geometry mismatch")
            }
        }
        let tiny = TraderLandGeometry.draggedPosition(col: 2, row: 3, translation: CGSize(width: 1, height: 1), scale: 1)
        precondition(tiny.col == 2 && tiny.row == 3)
        let lower = TraderLandGeometry.draggedPosition(col: 0, row: 0, translation: CGSize(width: -500, height: -500), scale: 1)
        precondition(lower.col == 0 && lower.row == 0)
        let upper = TraderLandGeometry.draggedPosition(col: 7, row: 7, translation: CGSize(width: 0, height: 500), scale: 1)
        precondition(upper.col == 7 && upper.row == 7)
        print("PASS: 38 drag geometry cases across five zoom levels, origin preservation and bounds")
    }
}
