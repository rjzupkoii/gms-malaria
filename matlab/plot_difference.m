% plot_difference.m
%
% Generate heatmaps with the percent difference between the reference (1km)
% and the scales used for sensitivity analysis.
clear;

% Create the heatmaps for the habitat
habitat_heatmap( '../python/out/2-5km_habitat.csv', 2.5 * 2.5, 'Habitat (1km vs 2.5km)', 'habitat vs. 2.5km.png');
habitat_heatmap( '../python/out/5km_habitat.csv', 5 * 5, 'Habitat (1km vs 5km)', 'habitat vs. 5km.png');

% Create the heatmaps for the landcover
landcover_heatmap( '../python/out/2-5km_landcover.csv', 2.5 * 2.5, 'Landcover (1km vs 2.5km)', 'landcover vs. 2.5km.png');
landcover_heatmap( '../python/out/5km_landcover.csv', 5 * 5, 'Landcover (1km vs 2.5km)', 'landcover vs. 5km.png');

function [] = habitat_heatmap(filename, scaling, title, out)
    % Load the data for 1km
    REFERENCE = '../python/out/1km_habitat.csv';
    ref = readmatrix(REFERENCE);
    
    % Note the years and deviations
    years = ref(1:1, 3:end);
    deviations = strcat('±', string(ref(2:end, 2)));
    deviations(1) = '\bf{\it{A. baimaii}}';
    deviations(11) = '\bf{\it{A. crascens}}';
    deviations(16) = '\bf{\it{A. dirus s.l.}}';
    deviations(34) = '\bf{\it{A. dirus s.s.}}';
    deviations(44) = '\bf{\it{A. scanloni}}';
    
    % Now remove the label columns and year row
    ref = ref(2:end, 3:end);
    
    % Load the comparision data, remove the label colums and year row
    comp = readmatrix(filename);
    comp = comp(2:end, 3:end);
    
    % Apply the scaling to the comparision data
    comp = comp * scaling;
    
    % Calculate the percent difference
    pd = ((comp - ref) ./ ref) * 100.0;  
    
    % Plot and save
    save_heatmap(pd, years, deviations, title, out);
end

function [] = landcover_heatmap(filename, scaling, title, out)    
    LABELS = {'Snow'; 'Shadow'; 'Water'; 'Forest'; 'Vegetation'; 'Vegetation / Scrub'; 'Barren'; 'Development'; 'Agricultural'};
    
    % Load the data for 1km
    REFERENCE = '../python/out/1km_landcover.csv';
    ref = readmatrix(REFERENCE);
    
    % Note the years, then remove the label columns and year row
    years = ref(1:1, 2:end);
    ref = ref(2:end, 2:end);
    
    % Load the comparision data, remove the label colums and year row
    comp = readmatrix(filename);
    comp = comp(2:end, 2:end);
    
    % Apply the scaling to the comparision data
    comp = comp * scaling;
    
    % Calculate the percent difference
    pd = ((comp - ref) ./ ref) * 100.0;  
    
    % Plot and save
    save_heatmap(pd, years, LABELS, title, out);
end

function [] = save_heatmap(data, xlabels, ylabels, title, out)
    % Plot the heatmap
    h = heatmap(data);
    caxis([-max(max(abs(data))) max(max(abs(data)))]);
    h.Colormap = [flipud(h.Colormap); h.Colormap];
    h.CellLabelFormat = '%0.3f%%';
    h.XDisplayLabels = xlabels;
    h.YDisplayLabels = ylabels;
    h.Title = title;

    % Save the heatmap
    graphic = gca;
    graphic.FontSize = 12;
    set(gcf, 'Position',  [0, 0, 2560, 1440]);
    print('-dpng', '-r300', out);
    clf;
    close;
end    