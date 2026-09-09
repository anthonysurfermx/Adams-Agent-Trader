import Foundation

enum TraderLandGeometry {
    /// Preserve the point of the initial grab, including the second tile of a
    /// rotated piece. Translation is measured in stable viewport coordinates.
    static func draggedPosition(col: Int, row: Int, translation: CGSize, scale: CGFloat) -> (col: Int, row: Int) {
        let safeScale = max(0.001, scale)
        let across = translation.width / (46 * safeScale)
        let down = translation.height / (23 * safeScale)
        // floor(value + 0.5) intentionally matches JavaScript Math.round.
        return (
            min(7, max(0, col + Int(floor((across + down) / 2 + 0.5)))),
            min(7, max(0, row + Int(floor((down - across) / 2 + 0.5))))
        )
    }
}
