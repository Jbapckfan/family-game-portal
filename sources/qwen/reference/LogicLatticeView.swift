import SwiftUI

struct CellState: Equatable {
    enum Type { case unknown, black, white }
    var type: Type
    var isMarked: Bool = false
}

struct LogicClue: Identifiable {
    let id = UUID()
    let text: String
    let validator: ([[CellState]]) -> Bool
}

struct LogicLatticeView: View {
    @State private var grid: [[CellState]] = Array(repeating: Array(repeating: CellState(type: .unknown), count: 5), count: 5)
    let clues: [LogicClue]
    
    var body: some View {
        VStack(spacing: 20) {
            // Grid Display
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 4) {
                ForEach(grid.indices, id: \.self) { row in
                    ForEach(grid[row].indices, id: \.self) { col in
                        Button(action: { toggleCell(row: row, col: col) }) {
                            Rectangle()
                                .foregroundColor(colorForState(grid[row][col].type))
                                .frame(width: 60, height: 60)
                                .cornerRadius(8)
                                .overlay(
                                    Text(grid[row][col].isMarked ? "?" : "")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                )
                        }
                    }
                }
            }
            
            // Clues List
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(clues) { clue in
                        ClueCard(clue: clue, isSatisfied: clue.validator(grid))
                    }
                }
                .padding()
            }
        }
        .padding()
        .background(Color.black.opacity(0.05))
    }
    
    func toggleCell(row: Int, col: Int) {
        var newState = grid[row][col]
        switch newState.type {
        case .unknown: newState.type = .black
        case .black: newState.type = .white
        case .white: newState.type = .unknown
        }
        grid[row][col] = newState
    }
    
    func colorForState(_ state: CellState.Type) -> Color {
        switch state {
        case .unknown: return Color.gray.opacity(0.3)
        case .black: return Color.black
        case .white: return Color.white
        }
    }
}

struct ClueCard: View {
    let clue: LogicClue
    let isSatisfied: Bool
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(clue.text)
                .font(.callout)
                .multilineTextAlignment(.leading)
            Spacer()
            Image(systemName: isSatisfied ? "checkmark.circle.fill" : "circle")
                .foregroundColor(isSatisfied ? .green : .gray)
        }
        .padding()
        .frame(width: 150, height: 100)
        .background(RoundedRectangle(cornerRadius: 12).strokeBorder(isSatisfied ? Color.green : Color.gray, lineWidth: 2))
    }
}